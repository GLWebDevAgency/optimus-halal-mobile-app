# Halal Engine V2 — JSON Schemas

Canonical schemas for the V2 dossier-anchored halal engine.
**These files are the source of truth.** Every dossier JSON in
`docs/naqiy/dossiers-recherches-naqiy/dossiers_v2/` MUST validate
against the matching schema.

## Schemas

| File | Validates | Dossiers path |
|---|---|---|
| `substance-dossier.schema.v1.json` | Substance dossiers (shellac, carmine, e471, gelatin...) | `dossiers_v2/json/naqiy_dossier_*.json` |
| `practice-dossier.schema.v1.json` | Practice dossiers (stunning, mechanical slaughter, ahl kitab...) | `dossiers_v2/practices/*/practice_*.json` |
| `practice-tuple.schema.v1.json` | Tuple arrays (species × method × variant) | `dossiers_v2/practices/*/tuples/tuples_*.json` |
| `match-pattern.schema.v1.json` | Runtime match patterns (compiled from dossiers) | DB seed |
| `scenario.schema.v1.json` | Score_matrix scenarios (exploded from dossiers) | DB seed |
| `evaluation-trace.schema.v1.json` | `halal_evaluations.trace` audit log structure | DB row |
| `gemini-semantic.schema.v1.json` | Gemini V2 provider output contract | Runtime |

## Validation

Run locally: `cd backend && pnpm validate:dossiers`
CI: `.github/workflows/validate-dossiers.yml` blocks PRs on violation.

## Versioning

Schemas are versioned (`.v1.json`). Breaking changes create a new
version (`.v2.json`) and the old one stays active until all dossiers
migrate. Never edit a published schema in place.
