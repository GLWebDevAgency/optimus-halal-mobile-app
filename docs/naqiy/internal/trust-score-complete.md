# Naqiy Trust Score — Index documentaire

> **Statut** : Ce document etait la reference monolithique V1-V4.
> Il a ete remplace par 4 artefacts specialises dans le cadre de la V5 (2026-03-06).

---

## Documents de reference V5.1

| Document | Audience | Description |
|---|---|---|
| [trust-score-whitepaper.md](trust-score-whitepaper.md) | Investisseurs, presse, public | Philosophie, resume executif, scores, FAQ |
| [trust-score-methodology.md](trust-score-methodology.md) | Developpeurs, certifieurs, auditeurs | Algorithme, blocs, caps, sigmoid, madhab, preuve |
| [trust-score-data-dictionary.md](trust-score-data-dictionary.md) | Developpeurs | Schema DB, champs JSON, types TS, pipeline |
| [trust-score-certifier-dossiers.md](trust-score-certifier-dossiers.md) | Certifieurs, experts | Fiche par certifieur (18 fiches avec scores + blocs + sources) |

## Documents complementaires

| Document | Description |
|---|---|
| [trust-score-madhab-weights.md](trust-score-madhab-weights.md) | Table des poids par madhab avec classification A/B/C et sources fiqh |
| [trust-score-changelog.md](trust-score-changelog.md) | Historique des evolutions V1 → V5.1 |
| [trust-score-roadmap.md](trust-score-roadmap.md) | Analyse critique et roadmap V6+ |
| [trust-score-formula.md](trust-score-formula.md) | Synthese V1 (archive — voir methodology.md pour la reference actuelle) |

## Code source

| Fichier | Role |
|---|---|
| `backend/src/db/schema/certifiers.ts` | Schema DB + algorithme de scoring (poids, sigmoid, caps, blocs, evidence) |
| `backend/src/services/certifier-score.service.ts` | Calcul runtime avec cache Redis (TTL 1h) |
| `backend/src/trpc/routers/scan.ts` | API tRPC — retourne scores + detail au frontend |
| `backend/asset/certification-list.json` | Donnees source des 18 certifieurs |
| `backend/src/db/seeds/certifiers.ts` | Pipeline de seed (JSON → DB) |
