# Naqiy — Operations Quotidiennes

## Vue d'ensemble

Ce document decrit les operations quotidiennes pour gerer le contenu Naqiy.
Trois systemes alimentent l'app mobile :

| Systeme | Source | Frequence | Action admin |
|---------|--------|-----------|-------------|
| **Rappels Produit** | API RappelConso (auto) | Quotidien 6h CET | Moderer si auto-approve OFF |
| **Alertes** | Redaction manuelle | Quand evenement | Creer dans dashboard |
| **Articles** | Redaction manuelle | Hebdomadaire | Creer dans dashboard |

---

## 1. Rappels Produit (automatique)

### Fonctionnement
- **Cron quotidien** (GitHub Actions, 6h CET) → sync RappelConso
- **Auto-approve ON** (defaut) : les rappels sont publies immediatement
- **Auto-approve OFF** : les rappels arrivent en "pending", tu moderes

### Actions admin
1. Ouvrir **Dashboard → Rappels Produit**
2. Verifier les stats (pending / approved / rejected)
3. Si auto-approve OFF : cliquer "Approuver" ou "Rejeter" par rappel
4. "Tout approuver" pour validation en masse
5. **Sync manuel** : bouton "Sync RappelConso" pour forcer une synchronisation

### Quand desactiver l'auto-approve ?
- Si tu veux filtrer les rappels non pertinents (ex: cosmetiques, jouets)
- Si tu veux ajouter du contexte avant publication

---

## 2. Alertes (redaction manuelle)

### Quand creer une alerte ?
- **Fraude halal** : faux certificat detecte, viande non conforme
- **Boycott** : nouvelle info sur une marque, rachat, implantation
- **Certification** : un certifieur ajoute/retire un store, obtient une norme
- **Communaute** : reglementation UE, signal terrain

### Comment creer une alerte ?
1. **Dashboard → Alertes → "+ Nouvelle alerte"**
2. Choisir la **categorie** (fraude / boycott / certification / communaute)
3. Choisir la **severite** (info / avertissement / critique)
4. Remplir **titre** (court, percutant) + **resume** (1-2 lignes) + **contenu** (details)
5. Ajouter l'**URL source** (Al-Kanz, AVS, DGCCRF, etc.)
6. Cliquer **"Creer l'alerte"**

### Modifier / Supprimer
- Cliquer l'icone crayon sur une alerte pour modifier
- Cliquer l'icone oeil barre pour desactiver (sans supprimer)
- Cliquer l'icone poubelle pour supprimer (irreversible)

---

## 3. Articles (redaction editoriale)

### Types d'articles
- **Blog** : analyses, investigations, tendances halal
- **Partenaires** : news Al-Kanz, communiques certifieurs
- **Educatif** : guides pratiques, comprendre les labels
- **Communaute** : evenements, temoignages

### Comment creer un article ?
1. **Dashboard → Articles → "+ Nouvel article"**
2. Remplir le **titre** (le slug URL est auto-genere)
3. Ecrire l'**extrait** (resume affiche dans les listes)
4. Rediger le **contenu** en Markdown
5. Ajouter l'**image de couverture** (URL)
6. Choisir le **type** + **tags**
7. **"Brouillon"** pour sauvegarder sans publier
8. **"Publier"** pour rendre visible dans l'app

### Workflow brouillon
- Creer en brouillon → relire → publier quand pret
- Depublier un article : cliquer "Depublier" sur la page d'edition
- Le temps de lecture est auto-calcule depuis le contenu

---

## 4. Veille automatique (Claude Code Triggers)

### Concept
Claude Code peut executer des taches planifiees (triggers/schedules) qui :
- Surveillent les flux RSS de Al-Kanz, AVS, Achahada
- Detectent du nouveau contenu
- Te notifient avec un resume + suggestion de draft

### Configuration

Depuis ton terminal, lance :

```bash
# Veille quotidienne Al-Kanz + AVS (9h chaque matin)
claude schedule create \
  --name "naqiy-veille-halal" \
  --cron "0 9 * * *" \
  --prompt "Verifie les derniers articles sur al-kanz.org/feed et avs.fr/actualites. Pour chaque nouveau contenu depuis hier, genere un resume de 2-3 lignes et propose un draft d'alerte ou d'article pour Naqiy. Indique la categorie suggeree (fraude/boycott/certification/communaute pour les alertes, ou blog/partner_news/educational pour les articles). Formate en Markdown."
```

### Ce que ca fait
1. Chaque matin a 9h, Claude verifie les sources
2. S'il y a du nouveau, il te le dit dans ta conversation Claude Code
3. Tu decides de creer l'alerte/article ou d'ignorer

### Sources a surveiller (extensible)
- `https://www.al-kanz.org/feed/` — RSS halal France
- `https://www.avs.fr/` — Actualites AVS
- `https://achahada.com/` — Actualites Achahada
- `https://rappel.conso.gouv.fr/` — Rappels gouvernementaux (deja automatise)

---

## 5. Checklist quotidienne

### Chaque matin (~10 min)
- [ ] Ouvrir le dashboard admin
- [ ] **Rappels Produit** : verifier 0 pending (si auto-approve OFF)
- [ ] **Alertes** : checker les suggestions de veille Claude
- [ ] **Articles** : verifier les brouillons en cours

### Chaque semaine
- [ ] Publier 1-2 articles (blog ou educatif)
- [ ] Verifier que le cron sync-recalls fonctionne (derniere sync < 24h)

### Quand un evenement tombe
- [ ] Creer une alerte immediatement (3 champs : titre, resume, contenu)
- [ ] Si le sujet merite un article long → creer un brouillon pour plus tard

---

## 6. Anticipation phases futures

### Phase 3 — Feed "A la Une" enrichi
- Les articles apparaissent deja dans "A la une" sur la home
- Futur : melanger articles + store spotlights + videos dans un feed unifie

### Phase 4 — Videos / Reels
- Admin pourra coller un lien Instagram/TikTok
- Auto-fetch thumbnail via oEmbed API
- Apparait dans le feed mobile

### Phase 5 — Stores partenaires
- Demandes d'inscription entrantes (B2C)
- Admin approve + programme un "spotlight" dans le feed
- Photos + description + offres speciales

### SEO / Landing blog
- Les articles ont un slug unique prevu pour le SEO
- Futur : section `/blog/[slug]` sur naqiy.app avec metadata OpenGraph
- Architecture deja anticipee (schema articles a slug, excerpt, tags)
