#!/usr/bin/env node
// Reproducible build of the EU accessibility standards mapping.
// Source of truth: this array. Emits mapping.json (machine) + mapping.csv (human).
// Run: `node build.mjs`
//
// The chain: WCAG 2.x success criterion → EN 301 549 v3.2.1 clause (chapter 9, Web)
// → EAA (Directive (EU) 2019/882) → German BFSG / BFSGV. EAA and BFSG do not
// enumerate individual success criteria; they incorporate WCAG wholesale via the
// harmonised standard EN 301 549, which grants the presumption of conformity.
// Rows with no EN 301 549 clause are WCAG 2.2 additions not yet harmonised under
// v3.2.1 (expected in EN 301 549 v4).

// WCAG 2.1 A+AA additions over 2.0 (subset present in this A+AA dataset).
const WCAG_21_ADDITIONS = new Set([
  '1.3.4', '1.3.5', '1.4.10', '1.4.11', '1.4.12', '1.4.13',
  '2.1.4', '2.5.1', '2.5.2', '2.5.3', '2.5.4', '4.1.3',
]);

// Canonical WCAG 2.x Level A + AA success criteria with EN 301 549 v3.2.1 clauses.
const SCS = [
  { sc: '1.1.1', level: 'A',  title: 'Non-text Content', en: '9.1.1.1' },
  { sc: '1.2.1', level: 'A',  title: 'Audio-only and Video-only (Prerecorded)', en: '9.1.2.1' },
  { sc: '1.2.2', level: 'A',  title: 'Captions (Prerecorded)', en: '9.1.2.2' },
  { sc: '1.2.3', level: 'A',  title: 'Audio Description or Media Alternative (Prerecorded)', en: '9.1.2.3' },
  { sc: '1.2.4', level: 'AA', title: 'Captions (Live)', en: '9.1.2.4' },
  { sc: '1.2.5', level: 'AA', title: 'Audio Description (Prerecorded)', en: '9.1.2.5' },
  { sc: '1.3.1', level: 'A',  title: 'Info and Relationships', en: '9.1.3.1' },
  { sc: '1.3.2', level: 'A',  title: 'Meaningful Sequence', en: '9.1.3.2' },
  { sc: '1.3.3', level: 'A',  title: 'Sensory Characteristics', en: '9.1.3.3' },
  { sc: '1.3.4', level: 'AA', title: 'Orientation', en: '9.1.3.4' },
  { sc: '1.3.5', level: 'AA', title: 'Identify Input Purpose', en: '9.1.3.5' },
  { sc: '1.4.1', level: 'A',  title: 'Use of Color', en: '9.1.4.1' },
  { sc: '1.4.2', level: 'A',  title: 'Audio Control', en: '9.1.4.2' },
  { sc: '1.4.3', level: 'AA', title: 'Contrast (Minimum)', en: '9.1.4.3' },
  { sc: '1.4.4', level: 'AA', title: 'Resize Text', en: '9.1.4.4' },
  { sc: '1.4.5', level: 'AA', title: 'Images of Text', en: '9.1.4.5' },
  { sc: '1.4.10', level: 'AA', title: 'Reflow', en: '9.1.4.10' },
  { sc: '1.4.11', level: 'AA', title: 'Non-text Contrast', en: '9.1.4.11' },
  { sc: '1.4.12', level: 'AA', title: 'Text Spacing', en: '9.1.4.12' },
  { sc: '1.4.13', level: 'AA', title: 'Content on Hover or Focus', en: '9.1.4.13' },
  { sc: '2.1.1', level: 'A',  title: 'Keyboard', en: '9.2.1.1' },
  { sc: '2.1.2', level: 'A',  title: 'No Keyboard Trap', en: '9.2.1.2' },
  { sc: '2.1.4', level: 'A',  title: 'Character Key Shortcuts', en: '9.2.1.4' },
  { sc: '2.2.1', level: 'A',  title: 'Timing Adjustable', en: '9.2.2.1' },
  { sc: '2.2.2', level: 'A',  title: 'Pause, Stop, Hide', en: '9.2.2.2' },
  { sc: '2.3.1', level: 'A',  title: 'Three Flashes or Below Threshold', en: '9.2.3.1' },
  { sc: '2.4.1', level: 'A',  title: 'Bypass Blocks', en: '9.2.4.1' },
  { sc: '2.4.2', level: 'A',  title: 'Page Titled', en: '9.2.4.2' },
  { sc: '2.4.3', level: 'A',  title: 'Focus Order', en: '9.2.4.3' },
  { sc: '2.4.4', level: 'A',  title: 'Link Purpose (In Context)', en: '9.2.4.4' },
  { sc: '2.4.5', level: 'AA', title: 'Multiple Ways', en: '9.2.4.5' },
  { sc: '2.4.6', level: 'AA', title: 'Headings and Labels', en: '9.2.4.6' },
  { sc: '2.4.7', level: 'AA', title: 'Focus Visible', en: '9.2.4.7' },
  { sc: '2.4.11', level: 'AA', title: 'Focus Not Obscured (Minimum)', en: '', v: '2.2' },
  { sc: '2.5.1', level: 'A',  title: 'Pointer Gestures', en: '9.2.5.1' },
  { sc: '2.5.2', level: 'A',  title: 'Pointer Cancellation', en: '9.2.5.2' },
  { sc: '2.5.3', level: 'A',  title: 'Label in Name', en: '9.2.5.3' },
  { sc: '2.5.4', level: 'A',  title: 'Motion Actuation', en: '9.2.5.4' },
  { sc: '2.5.7', level: 'AA', title: 'Dragging Movements', en: '', v: '2.2' },
  { sc: '2.5.8', level: 'AA', title: 'Target Size (Minimum)', en: '', v: '2.2' },
  { sc: '3.1.1', level: 'A',  title: 'Language of Page', en: '9.3.1.1' },
  { sc: '3.1.2', level: 'AA', title: 'Language of Parts', en: '9.3.1.2' },
  { sc: '3.2.1', level: 'A',  title: 'On Focus', en: '9.3.2.1' },
  { sc: '3.2.2', level: 'A',  title: 'On Input', en: '9.3.2.2' },
  { sc: '3.2.3', level: 'AA', title: 'Consistent Navigation', en: '9.3.2.3' },
  { sc: '3.2.4', level: 'AA', title: 'Consistent Identification', en: '9.3.2.4' },
  { sc: '3.2.6', level: 'A',  title: 'Consistent Help', en: '', v: '2.2' },
  { sc: '3.3.1', level: 'A',  title: 'Error Identification', en: '9.3.3.1' },
  { sc: '3.3.2', level: 'A',  title: 'Labels or Instructions', en: '9.3.3.2' },
  { sc: '3.3.3', level: 'AA', title: 'Error Suggestion', en: '9.3.3.3' },
  { sc: '3.3.4', level: 'AA', title: 'Error Prevention (Legal, Financial, Data)', en: '9.3.3.4' },
  { sc: '3.3.7', level: 'A',  title: 'Redundant Entry', en: '', v: '2.2' },
  { sc: '3.3.8', level: 'AA', title: 'Accessible Authentication (Minimum)', en: '', v: '2.2' },
  { sc: '4.1.1', level: 'A',  title: 'Parsing', en: '9.4.1.1', note: 'Obsolete in WCAG 2.2; retained for WCAG 2.1 / EN 301 549 v3.2.1 audits.' },
  { sc: '4.1.2', level: 'A',  title: 'Name, Role, Value', en: '9.4.1.2' },
  { sc: '4.1.3', level: 'AA', title: 'Status Messages', en: '9.4.1.3' },
];

function wcagVersion(row) {
  if (row.v === '2.2') return '2.2';
  if (WCAG_21_ADDITIONS.has(row.sc)) return '2.1';
  return '2.0';
}

const criteria = SCS.map((r) => {
  const harmonised = r.en !== '';
  return {
    sc: r.sc,
    level: r.level,
    title: r.title,
    wcag_version: wcagVersion(r),
    en301549: r.en,
    eaa: harmonised ? 'Annex I (via EN 301 549)' : '',
    bfsg: harmonised ? '§§ 3, 12 BFSG / BFSGV' : '',
    harmonised,
    notes: r.note || (r.v === '2.2'
      ? 'WCAG 2.2 addition; not yet referenced by EN 301 549 v3.2.1 (expected in v4).'
      : ''),
  };
});

const dataset = {
  name: 'eu-accessibility-mapping',
  version: '1.0.0',
  license: 'MIT',
  description: 'Crosswalk of WCAG 2.x Level A+AA success criteria to EN 301 549 v3.2.1, the EU Accessibility Act, and the German BFSG.',
  sources: {
    wcag21: 'https://www.w3.org/TR/WCAG21/',
    wcag22: 'https://www.w3.org/TR/WCAG22/',
    en301549: 'https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf',
    eaa: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32019L0882',
    bfsg: 'https://www.gesetze-im-internet.de/bfsg/',
  },
  columns: {
    sc: 'WCAG success criterion number',
    level: 'WCAG conformance level (A or AA)',
    title: 'Success criterion short title',
    wcag_version: 'WCAG version that introduced the criterion (2.0 / 2.1 / 2.2)',
    en301549: 'EN 301 549 v3.2.1 clause (chapter 9, Web). Empty = not yet harmonised.',
    eaa: 'EU Accessibility Act reference (incorporated via EN 301 549).',
    bfsg: 'German BFSG / BFSGV reference (presumption of conformity via EN 301 549).',
    harmonised: 'true if referenced by EN 301 549 v3.2.1.',
    notes: 'Caveats (obsoletion, pending harmonisation).',
  },
  criteria,
};

import { writeFileSync } from 'node:fs';

writeFileSync('mapping.json', JSON.stringify(dataset, null, 2) + '\n');

const cols = ['sc', 'level', 'title', 'wcag_version', 'en301549', 'eaa', 'bfsg', 'harmonised', 'notes'];
const esc = (v) => {
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const csv = [cols.join(',')]
  .concat(criteria.map((row) => cols.map((c) => esc(row[c])).join(',')))
  .join('\n') + '\n';
writeFileSync('mapping.csv', csv);

console.log(`Wrote mapping.json + mapping.csv (${criteria.length} criteria, ${criteria.filter((c) => c.harmonised).length} harmonised under EN 301 549 v3.2.1).`);
