# eu-accessibility-mapping

An open, machine-readable crosswalk from **WCAG 2.x** success criteria to the
**EN 301 549**, **EU Accessibility Act (EAA)**, and **German BFSG** that reference them.

If you build accessibility tooling, write a VPAT/accessibility statement, or argue a BFSG
case, you keep re-deriving the same chain: *which WCAG criterion maps to which EN 301 549
clause, and how does that connect to the EAA and the BFSG?* This repo answers that once, as
data you can diff and reuse — MIT, no attribution required.

It's the reference mapping behind the reports at [wcagdesk.eu](https://wcagdesk.eu),
published openly so the legal↔technical mapping our reports use can be verified
independently.

## The chain

```
WCAG 2.x SC  →  EN 301 549 v3.2.1 (ch. 9, Web)  →  EAA (Directive (EU) 2019/882)  →  BFSG / BFSGV (DE)
```

EN 301 549 chapter 9 references WCAG 2.1 Level A + AA verbatim. The EAA and the German BFSG
do **not** enumerate individual success criteria — they incorporate WCAG wholesale through
the harmonised standard EN 301 549, which grants the *presumption of conformity*. So the
per-criterion EAA/BFSG columns mean "in scope via EN 301 549", not a distinct clause number.

## Files

- **`mapping.json`** — authoritative, machine-readable (metadata + `criteria[]`).
- **`mapping.csv`** — same data, spreadsheet-friendly.
- **`build.mjs`** — the generator and single source of truth. `node build.mjs` regenerates
  both outputs. No dependencies.

## Columns

| Column | Meaning |
|--------|---------|
| `sc` | WCAG success criterion (e.g. `1.4.3`) |
| `level` | Conformance level — `A` or `AA` |
| `title` | Criterion short title |
| `wcag_version` | Version that introduced it — `2.0` / `2.1` / `2.2` |
| `en301549` | EN 301 549 v3.2.1 clause (ch. 9). Empty = not yet harmonised. |
| `eaa` | EAA reference (via EN 301 549) |
| `bfsg` | BFSG / BFSGV reference (presumption via EN 301 549) |
| `harmonised` | `true` if referenced by EN 301 549 v3.2.1 |
| `notes` | Caveats (obsoletion, pending harmonisation) |

## Scope & caveats

- **Level A + AA only.** AAA is out of scope (not required by the EAA/BFSG baseline).
- **WCAG 2.2 additions** (e.g. 2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8) have **no EN 301 549
  clause yet** — v3.2.1 predates WCAG 2.2. They're flagged `harmonised: false` and expected
  to land in EN 301 549 v4. They're included so audits are forward-compatible.
- **4.1.1 Parsing** is **obsolete in WCAG 2.2** but kept for WCAG 2.1 / EN 301 549 v3.2.1
  audits that still cite it.
- This is a standards crosswalk, **not legal advice**. The BFSG/EAA columns describe the
  harmonisation route, not a determination for any specific product.

## Sources

- WCAG 2.1 — https://www.w3.org/TR/WCAG21/
- WCAG 2.2 — https://www.w3.org/TR/WCAG22/
- EN 301 549 v3.2.1 — https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf
- EAA (Directive (EU) 2019/882) — https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32019L0882
- BFSG — https://www.gesetze-im-internet.de/bfsg/

## Contributing

Corrections welcome — open an issue or PR against `build.mjs` (not the generated files).
If EN 301 549 v4 publishes WCAG 2.2 clause numbers, that's the main expected update.

## License

[MIT](./LICENSE). Use it in anything, commercial or not.

---

Maintained by [WCAGdesk](https://wcagdesk.eu) · continuous WCAG 2.2 AA monitoring with
timestamped, independently verifiable evidence for the EU Accessibility Act and BFSG.
