# 14 — Cron, Automation & Data Sourcing Strategy

> Naqiy Tier-1 World-Class Automation Blueprint
> Date: 2026-03-05 | Auteur: Claude CTO

---

## 1. Audit de l'existant

### Architecture actuelle

```
GitHub Actions (orchestrateur)
  └─ refresh-stores.yml ─── cron: lundi 3h CET ──→ POST /internal/refresh-stores
                                                      ├─ AVS API (3 endpoints)
                                                      ├─ Achahada API (8 filtres)
                                                      ├─ Upload logos R2
                                                      ├─ Upsert stores + hours
                                                      └─ Invalidate cache Redis

Railway (deploy-time)
  └─ preDeployCommand ──→ entrypoint.ts
                            ├─ Drizzle migrations
                            └─ run-all.ts (10 phases seed)

Webhooks (event-driven)
  └─ POST /webhooks/revenuecat ──→ RevenueCat subscription events

Scripts manuels (ad-hoc)
  ├─ pnpm fetch:stores ──→ Sauvegarde assets/ (AVS + Achahada)
  └─ pnpm upload:logos ──→ Upload R2
```

### CRON existant unique

| Job | Schedule | Cible | TTL lock | Statut |
|-----|----------|-------|----------|--------|
| `refresh-stores` | Lundi 3h CET | `/internal/refresh-stores` | 300s | Production |

### Sources de données actuelles

| Source | Type | Fréquence | Automation |
|--------|------|-----------|-----------|
| AVS API | REST | Hebdo (lundi) | GitHub Actions |
| Achahada API | REST | Hebdo (lundi) | GitHub Actions |
| OpenFoodFacts | REST | On-demand (scan) | Temps réel |
| Google Places | REST | Manuel | Script local |
| BDS Movement | Statique | Jamais | Seed manuel |
| Al-Kanz | Statique | Jamais | Seed manuel |
| RappelConso | Statique | Jamais | Seed manuel |
| Certifiers | Statique | Jamais | Seed manuel |
| Ingredient Rulings | Statique | Jamais | Seed manuel |

---

## 2. Stratégie CRON Tier-1

### Vue d'ensemble des jobs proposés

```
┌──────────────────────────────────────────────────────────────────────┐
│                     NAQIY CRON AUTOMATION MAP                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  QUOTIDIEN (nuit, 2h-5h CET)                                        │
│  ├─ 02:00 │ refresh-google-places    │ Google Places enrichment     │
│  └─ 04:00 │ ingest-rappelconso       │ Rappels produits FR          │
│                                                                      │
│  HEBDOMADAIRE                                                        │
│  ├─ Lun 03:00 │ refresh-stores       │ AVS + Achahada (EXISTANT)   │
│  ├─ Mar 03:00 │ refresh-boycott      │ BDS + Boycott-X scraping    │
│  └─ Mer 03:00 │ ingest-alkanz        │ Al-Kanz RSS → alertes       │
│                                                                      │
│  MENSUEL                                                             │
│  ├─ 1er  03:00 │ refresh-certifiers   │ Certifier trust re-compute │
│  └─ 15e  03:00 │ cleanup-stale-data   │ Purge scans anciens, cache │
│                                                                      │
│  EVENT-DRIVEN (webhooks)                                             │
│  └─ POST /webhooks/revenuecat  │ Subscription lifecycle             │
│                                                                      │
│  ON-DEMAND (scan temps réel)                                         │
│  └─ OpenFoodFacts API          │ Product lookup on barcode scan     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Détail de chaque job

#### JOB 1: `refresh-stores` (EXISTANT)
- **Fréquence** : Lundi 03:00 CET
- **Source** : AVS + Achahada APIs
- **Action** : Fetch → transform → deduplicate → upsert stores + hours → upload logos R2 → invalidate cache
- **Statut** : Production, fiable

#### JOB 2: `refresh-google-places` (NOUVEAU)
- **Fréquence** : Quotidien 02:00 CET
- **Source** : Google Places API (New)
- **Action** : Enrichir les stores non-enrichis ou stale (>30 jours)
  - Fetch rating, reviews, photos, horaires Google
  - Upload photos R2
  - Upsert `google_reviews`, `stores.google_*` columns
- **Coût** : ~$2/mois (1300 stores × $0.005/1000 calls × 30 jours)
- **Priorité** : Haute — les horaires Google sont la source la plus fiable

#### JOB 3: `refresh-boycott` (NOUVEAU)
- **Fréquence** : Mardi 03:00 CET
- **Sources** :
  1. **BDS Movement** : scraper HTML de `bdsmovement.net/Guide-to-BDS-Boycott`
  2. **Who Profits** : `whoprofits.org` (base de données israélienne)
  3. **Boycott-X** : si API disponible
- **Action** :
  - Scrape pages sources (Cheerio, pas de headless browser)
  - Normaliser : company_name, brands[], level, reason
  - Diff avec DB existante → nouvelles entrées = `is_active: false` (review manuelle)
  - Notifier admin via Slack/email si nouvelles détections
- **Sécurité** : Les nouvelles entrées ne sont PAS automatiquement visibles — validation humaine requise
- **Priorité** : Moyenne

#### JOB 4: `ingest-rappelconso` (NOUVEAU)
- **Fréquence** : Quotidien 04:00 CET
- **Source** : API RappelConso (data.gouv.fr)
  - `https://data.economie.gouv.fr/api/records/1.0/search/?dataset=rappelconso0`
  - Filtre : catégorie "Alimentation", derniers 7 jours
- **Action** :
  - Fetch nouveaux rappels alimentaires
  - Filtrer par mots-clés halal (viande, volaille, gélatine, additifs)
  - Créer alerte dans `alerts` table
  - Push notification aux utilisateurs concernés
- **Priorité** : Haute — sécurité alimentaire

#### JOB 5: `ingest-alkanz` (NOUVEAU)
- **Fréquence** : Mercredi 03:00 CET
- **Source** : RSS feed Al-Kanz (`al-kanz.org/feed/`)
- **Action** :
  - Parser RSS (catégories : halal, certification, fraude)
  - Détecter articles pertinents via mots-clés
  - Créer alertes `community` dans `alerts` table
  - Lien vers article source
- **Priorité** : Moyenne

#### JOB 6: `refresh-certifiers` (NOUVEAU)
- **Fréquence** : 1er du mois 03:00 CET
- **Action** :
  - Re-calculer les trust scores (certifier_events → scores)
  - Mettre à jour `materialize-scores`
  - Invalider cache Redis `certifiers:*`
- **Priorité** : Basse (les scores changent rarement)

#### JOB 7: `cleanup-stale-data` (NOUVEAU)
- **Fréquence** : 15 du mois 03:00 CET
- **Action** :
  - Purger scans anonymes > 90 jours
  - Purger tokens de refresh expirés > 30 jours
  - Purger push tokens inactifs > 60 jours
  - Vacuum/analyze PostgreSQL
  - Rapport de métriques (taille DB, nombre records)
- **Priorité** : Basse

---

## 3. Architecture d'implémentation

### Pattern recommandé : HTTP-triggered Crons via GitHub Actions

```yaml
# .github/workflows/cron-{job-name}.yml
on:
  schedule:
    - cron: '0 2 * * *'       # Fréquence
  workflow_dispatch:            # Trigger manuel

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger job
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST "${{ secrets.API_URL }}/internal/{job-name}" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}")
          if [ "$STATUS" != "202" ] && [ "$STATUS" != "409" ]; then
            echo "Failed with status $STATUS"
            exit 1
          fi

      - name: Wait for completion
        run: sleep 60

      - name: Check result
        run: |
          RESULT=$(curl -s "${{ secrets.API_URL }}/internal/{job-name}/status" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}")
          echo "$RESULT" | jq .
          SUCCESS=$(echo "$RESULT" | jq -r '.lastRun.success')
          [ "$SUCCESS" = "true" ] || exit 1
```

### Pourquoi GitHub Actions et pas node-cron/BullMQ ?

| Critère | GitHub Actions | node-cron (in-process) | BullMQ (worker) |
|---------|---------------|----------------------|-----------------|
| **Crash isolation** | Job crash ≠ server crash | Crash = server crash | Séparé mais infra supplémentaire |
| **Observabilité** | Logs + email natifs | Custom logging | Dashboard Redis |
| **Coût** | Gratuit (2000 min/mois) | 0 | Redis worker Railway (~$5/mois) |
| **Scalabilité** | Horizontal natif | Single process | Bon |
| **Maintenance** | YAML simple | Code applicatif | Redis + worker à maintenir |
| **Retry** | Natif `continue-on-error` | Custom | Natif |
| **Alerting** | GitHub notifications | Custom | Custom |

**Verdict** : GitHub Actions est optimal pour un backend Railway mono-service avec <10 jobs.

---

## 4. Sourcing Boycott — Méthode améliorée

### Sources à intégrer

| Source | URL | Type | Fiabilité | Fréquence recommandée |
|--------|-----|------|-----------|----------------------|
| **BDS Official** | bdsmovement.net | Scrape HTML | Haute (source primaire) | Hebdo |
| **Who Profits** | whoprofits.org | Scrape/API | Haute (base de données) | Hebdo |
| **Ethical Consumer** | ethicalconsumer.org | Scrape | Moyenne (UK-centric) | Mensuel |
| **Al-Kanz** | al-kanz.org | RSS | Haute (France, halal-focused) | Hebdo |

### Pipeline de scraping boycott

```
1. SCRAPE ──→ 2. NORMALIZE ──→ 3. DIFF ──→ 4. REVIEW ──→ 5. PUBLISH
   │              │                │           │              │
   │ Cheerio      │ company_name   │ Compare   │ Admin notif  │ is_active
   │ HTML parse   │ brands[]       │ with DB   │ Slack/email  │ = true
   │ RSS parse    │ level          │ new/gone  │ Manual OK    │
   └──────────────┴────────────────┴───────────┴──────────────┘
```

### Sécurité du pipeline

- **Aucune publication automatique** : les nouvelles entrées sont créées avec `is_active: false`
- **Notification admin** : Slack webhook ou email avec diff (ajouts/retraits)
- **Validation humaine** : l'admin active via un dashboard ou endpoint interne
- **Audit trail** : chaque modification logguée avec source + timestamp

---

## 5. Récapitulatif des priorités

### Phase 1 — Immédiat (Sprint actuel)
- [x] Fix seed boycott (doublons, upsert cassé)
- [x] Fix cache Redis stale
- [x] Unique constraint `company_name`

### Phase 2 — Court terme (1-2 sprints)
- [ ] `ingest-rappelconso` — sécurité alimentaire, impact utilisateur direct
- [ ] `refresh-google-places` — horaires fiables, source la plus fraîche

### Phase 3 — Moyen terme (3-4 sprints)
- [ ] `refresh-boycott` — scraping BDS + Who Profits
- [ ] `ingest-alkanz` — alertes communautaires

### Phase 4 — Long terme
- [ ] `cleanup-stale-data` — maintenance DB
- [ ] `refresh-certifiers` — re-calcul trust scores
- [ ] Dashboard admin pour validation manuelle des données scrapées

---

## 6. Benchmarks Tier-1

| App | Cron strategy | Jobs count | Infra |
|-----|--------------|-----------|-------|
| **Yuka** | ~10 crons (product refresh, OFF sync, alerts) | 8-12 | Kubernetes CronJobs |
| **Too Good To Go** | ~15 crons (store sync, notifications, cleanup) | 12-15 | Cloud Scheduler |
| **Halal Check** | ~3 crons (basic sync) | 2-4 | Heroku Scheduler |
| **Naqiy (cible)** | 7 crons (stores, boycott, alerts, enrichment, cleanup) | 7 | GitHub Actions |

Naqiy est parfaitement positionné avec 7 jobs pour couvrir tous les besoins d'une app Tier-1 halal sans over-engineering l'infrastructure.
