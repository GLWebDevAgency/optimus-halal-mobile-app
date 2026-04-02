# VEILLE NAQIY — 1er avril 2026

## Résumé

| Métrique | Valeur |
|---|---|
| Sources vérifiées | 5 (4 RSS + 1 website) |
| Nouveaux éléments détectés | 19 |
| Éléments pertinents retenus | 8 |
| Drafts créés via API | **8** (2 alertes, 6 articles) |
| Images uploadées R2 | 8 (fallback Unsplash) |
| Éléments ignorés | 6 (non pertinents) |
| Éléments pertinents non retenus | 5 (redondants ou légers) |

> Note : premier fetch pour toutes les sources (`lastFetchedAt` = null). Les 5 items les plus récents par source ont été récupérés. La source "RappelConso Alim" (type website, pas de RSS) n'a pas été traitée.

---

## Drafts créés

### Alertes

1. **[ALERTE]** Proposition de loi Yadan (PPL 575) : menace sur le droit au boycott — `boycott` — severity: **warning** — priority: high
   - Source : [BDS France](https://www.bdsfrance.org/loi-yadan-une-attaque-frontale-contre-la-liberte-dexpression/)
   - ID : `2a1e0e3f-c141-4e0f-8d95-cb83fb5fc846`

2. **[ALERTE]** 17e appel à la campagne de boycott contre ZIM — `boycott` — severity: info
   - Source : [BDS France](https://www.bdsfrance.org/dix-septieme-appel-campagne-contre-zim/)
   - ID : `b2218652-af2b-4a17-91ba-057a4a6bc251`

### Articles

3. **[ARTICLE]** Halal en GMS : un marché relancé, dominé par la charcuterie industrielle — `partner_news` — 3 min — image: fallback
   - Source : [Al-Kanz](https://www.al-kanz.org/2026/03/25/halal-gms-charcuterie-industrielle/)
   - ID : `aa5dfaf1-6e1c-432c-871d-45c89dfd36d9`

4. **[ARTICLE]** Ramadan 2026 : les stratégies des enseignes de grande distribution passées au crible — `partner_news` — 4 min — image: fallback
   - Source : [Al-Kanz](https://www.al-kanz.org/2026/03/22/ramadan-2026-catalogues/)
   - ID : `72ae0363-250d-4d56-be4f-044751561a9a`

5. **[ARTICLE]** Électronarcose et abattage halal : le débat expliqué — `educational` — 3 min — image: fallback
   - Source : [Achahada](https://achahada.com/2025/12/08/electronarcose-assommage-halal-ou-non/)
   - ID : `b98d4245-764a-4e3c-9846-72b722061aec`

6. **[ARTICLE]** Certification halal : le problème de l'auto-contrôle — `educational` — 2 min — image: fallback
   - Source : [Achahada](https://achahada.com/2025/12/08/conflit-dinteret-de-lauto-controle/)
   - ID : `864801af-8521-4149-b75a-6ab04720f27b`

7. **[ARTICLE]** AVS réaffirme son refus total de l'assommage — `educational` — 3 min — image: fallback
   - Source : [AVS](https://avs.fr/avs-et-linterdiction-de-lassommage/)
   - ID : `9927a643-9427-432a-aff3-38d255bd8912`

8. **[ARTICLE]** Comment AVS garantit le caractère halal : ses procédés de certification — `educational` — 3 min — image: fallback
   - Source : [AVS](https://avs.fr/les-procedes-de-certification-utilise-par-avs-pour-garantir-le-caractere-halal-des-viandes/)
   - ID : `3b1fe743-6941-408d-9b96-83ce16f315c6`

---

## Éléments ignorés (non pertinents)

1. **Achahada** — "RAPPEL ACHAHADA" (contenu vide/vidéo)
2. **Achahada** — "achahada interview bilal" (contenu vide/vidéo)
3. **Al-Kanz** — "Changement d'heure : horaires de prière" (religion sans lien halal)
4. **Al-Kanz** — "Après ramadan, jeûner six jours durant chawwal" (religion sans lien halal)
5. **Al-Kanz** — "Don du sang au centre Annour à Mulhouse" (communauté, pas halal/alimentaire)
6. **AVS** — "Politique de confidentialité et de protection des données" (hors sujet)

## Éléments pertinents non retenus comme drafts

5 items supplémentaires étaient pertinents mais redondants ou à contenu trop léger :

- **BDS** : Journée de la terre palestinienne (solidarité/politique)
- **BDS** : Blocage des transferts d'armes (géopolitique)
- **BDS** : Événement à Poitiers (date passée, 24/03)
- **Achahada** : "c'est pas sorcier de refuser l'électronarcose" (redondant avec article électronarcose)
- **AVS** : "La certification halal" (redondant avec article procédés)

---

## Notes techniques

- **Images** : Les 8 images utilisent des fallback Unsplash (food, certification, boycott) car les images RSS sources avaient des URLs tronquées ou absentes.
- **Source RappelConso** : Non traitée (type `website`, pas de flux RSS). À implémenter : scraper dédié pour les rappels alimentaires.
- **Achahada** : Les items RSS contiennent très peu de texte (contenu vidéo). Le contenu des articles a été enrichi à partir du contexte disponible.
- **API** : Tous les appels `POST /internal/create-draft` ont retourné `{"success": true}`.

---

**À VALIDER dans le dashboard admin.**

*Rapport généré automatiquement par la veille éditoriale Naqiy — 1er avril 2026*
