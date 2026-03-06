# Trust Score — Certifier Dossiers (V5.1)

> Individual dossier sheets for all 18 certifiers in the Naqiy Trust Index V5.1.
> Practice data sourced from `backend/asset/certification-list.json`.
> Scores sourced from `docs/naqiy/internal/trust-score-madhab-weights.md` section 7.
> Last updated: 2026-03-06.

---

## Methodology Notes

### Tier Classification

| Tier | Editorial Score Range | Meaning |
|---|:---:|---|
| **Strong** | >= 90 | Rigorous halal certification with robust controls |
| **Moderate** | 55 -- 89 | Partial compliance, some concerning practices |
| **Caution** | 20 -- 54 | Significant shortcomings, limited assurance |
| **Weak** | < 20 | Minimal or no halal assurance |

### 4-Block Breakdown Formulas

| Block | Formula | Max points |
|---|---|:---:|
| **Ritual Validity** | (1 - negativeRitualUsed / 52) * 100 | 100 |
| **Operational Assurance** | positiveOpsUsed / 40 * 100 | 100 |
| **Product Quality (Tayyib)** | acceptsVsm ? 0 : 100 | 100 |
| **Transparency** | transparencyPoints / 15 * 100 | 100 |

Where:
- negativeRitualUsed = sum of absolute editorial penalties for true negative indicators (mechanical=-20, stunning=-18, electronarcosis=-12, postSlaughterElec=-2)
- positiveOpsUsed = sum of editorial bonuses for true positive indicators (controllersAreEmployees=+15, controllersPresentEachProduction=+15, hasSalariedSlaughterers=+10)
- transparencyPoints = (charter?5:0) + (auditReports?5:0) + (companyList?5:0)

### Evidence Levels

| Level | Definition |
|---|---|
| **verified** | Multiple independent sources confirm practices (site visits, investigative reports, official audits) |
| **declared** | Certifier's own public declarations; not independently verified |
| **inferred** | Community reports, comparative analyses, or absence of contradicting data |

---

## Tier 1 — Strong (Editorial >= 90)

---

### European Halal Trust

| Field | Value |
|---|---|
| **ID** | `european-halal-trust` |
| **Website** | https://www.ehthalal.com |
| **Creation Year** | 2015 |
| **Tier** | Strong |
| **Evidence Level** | verified |

#### Scores

| Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|:---:|:---:|:---:|:---:|:---:|
| 100 | 100 | 100 | 100 | 100 |

#### Practice Profile

| Indicator | Value |
|---|:---:|
| controllersAreEmployees | true |
| controllersPresentEachProduction | true |
| hasSalariedSlaughterers | true |
| acceptsMechanicalPoultrySlaughter | false |
| acceptsPoultryElectronarcosis | false |
| acceptsPoultryElectrocutionPostSlaughter | false |
| acceptsStunningForCattleCalvesLambs | false |
| acceptsVsm | false |
| transparencyPublicCharter | true |
| transparencyAuditReports | true |
| transparencyCompanyList | true |
| halal-assessment | true |
| controversyPenalty | 0 |

#### 4-Block Breakdown

| Block | Score | Reasoning |
|---|:---:|---|
| Ritual Validity | 100 | No negative practices (0/52 penalties) |
| Operational Assurance | 100 | All 3 positive indicators (40/40) |
| Product Quality (Tayyib) | 100 | Rejects VSM |
| Transparency | 100 | Charter + audit reports + company list (15/15) |

#### Notes

- Cahier des charges public (ehthalal.com). Publie des rapports de controle synthetiques. Liste des entreprises certifiees accessible sur le site.

#### Evidence Sources

- ehthalal.com -- cahier des charges et rapports de controle publics
- ehthalal.com -- liste des entreprises certifiees

---

### ALTAKWA

| Field | Value |
|---|---|
| **ID** | `altakwa` |
| **Website** | https://www.altakwa.fr |
| **Creation Year** | 1989 |
| **Tier** | Strong |
| **Evidence Level** | declared |

#### Scores

| Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|:---:|:---:|:---:|:---:|:---:|
| 97 | 98 | 97 | 96 | 97 |

#### Practice Profile

| Indicator | Value |
|---|:---:|
| controllersAreEmployees | true |
| controllersPresentEachProduction | true |
| hasSalariedSlaughterers | true |
| acceptsMechanicalPoultrySlaughter | false |
| acceptsPoultryElectronarcosis | false |
| acceptsPoultryElectrocutionPostSlaughter | false |
| acceptsStunningForCattleCalvesLambs | false |
| acceptsVsm | false |
| transparencyPublicCharter | true |
| transparencyAuditReports | false |
| transparencyCompanyList | false |
| halal-assessment | true |
| controversyPenalty | 0 |

#### 4-Block Breakdown

| Block | Score | Reasoning |
|---|:---:|---|
| Ritual Validity | 100 | No negative practices (0/52 penalties) |
| Operational Assurance | 100 | All 3 positive indicators (40/40) |
| Product Quality (Tayyib) | 100 | Rejects VSM |
| Transparency | 33 | Charter only (5/15) |

#### Notes

- Fondee en 1989 par Cheikh Ahmad ALDILAIMI. Equipes de sacrificateurs-inspecteurs sur site. Refus categorique de tout etourdissement (electronarcose, percussion, gazage). Source: altakwa.fr

#### Evidence Sources

- altakwa.fr -- site officiel et charte

---

### AVS (A Votre Service)

| Field | Value |
|---|---|
| **ID** | `avs-a-votre-service` |
| **Website** | https://avs.fr |
| **Creation Year** | 1991 |
| **Tier** | Strong |
| **Evidence Level** | verified |

#### Scores

| Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|:---:|:---:|:---:|:---:|:---:|
| 96 | 97 | 96 | 96 | 96 |

#### Practice Profile

| Indicator | Value |
|---|:---:|
| controllersAreEmployees | true |
| controllersPresentEachProduction | true |
| hasSalariedSlaughterers | true |
| acceptsMechanicalPoultrySlaughter | false |
| acceptsPoultryElectronarcosis | false |
| acceptsPoultryElectrocutionPostSlaughter | false |
| acceptsStunningForCattleCalvesLambs | false |
| acceptsVsm | true |
| transparencyPublicCharter | true |
| transparencyAuditReports | false |
| transparencyCompanyList | true |
| halal-assessment | true |
| controversyPenalty | 0 |

#### 4-Block Breakdown

| Block | Score | Reasoning |
|---|:---:|---|
| Ritual Validity | 100 | No negative ritual practices (0/52 penalties) |
| Operational Assurance | 100 | All 3 positive indicators (40/40) |
| Product Quality (Tayyib) | 0 | Accepts VSM |
| Transparency | 67 | Charter + company list (10/15) |

#### Notes

- 155 controleurs salaries (source: avs.fr). Presence permanente sur tous les sites de production.
- Accepte la VSM dans les charcuteries certifiees (source: al-kanz.org 2013, halalfrais.fr 2026). Polemique historique Isla Delice (2010-2013, RESOLUE : AVS s'est separee d'Isla Delice fin 2012). AVS certifie desormais Isla Mondial (0% VSM).
- Mai 2025 : AVS suspend sa certification a l'abattoir de Meaux suite a des revelations L214 sur la maltraitance animale (source: l214.com). Preuve de reactivite.
- Charte halal publique (avs.fr/charte-halal). Liste des marques certifiees publiee (avs.fr/marques).

#### Evidence Sources

- avs.fr -- charte halal publique et liste des marques
- l214.com -- rapport independant (mai 2025)
- al-kanz.org -- enquetes (2010-2013)

---

### ACHAHADA

| Field | Value |
|---|---|
| **ID** | `achahada` |
| **Website** | https://www.achahada.com |
| **Creation Year** | 2009 |
| **Tier** | Strong |
| **Evidence Level** | declared |

#### Scores

| Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|:---:|:---:|:---:|:---:|:---:|
| 95 | 94 | 95 | 96 | 95 |

#### Practice Profile

| Indicator | Value |
|---|:---:|
| controllersAreEmployees | true |
| controllersPresentEachProduction | true |
| hasSalariedSlaughterers | false |
| acceptsMechanicalPoultrySlaughter | false |
| acceptsPoultryElectronarcosis | false |
| acceptsPoultryElectrocutionPostSlaughter | false |
| acceptsStunningForCattleCalvesLambs | false |
| acceptsVsm | false |
| transparencyPublicCharter | true |
| transparencyAuditReports | false |
| transparencyCompanyList | true |
| halal-assessment | true |
| controversyPenalty | 0 |

#### 4-Block Breakdown

| Block | Score | Reasoning |
|---|:---:|---|
| Ritual Validity | 100 | No negative practices (0/52 penalties) |
| Operational Assurance | 75 | Controllers employed + present, but no salaried slaughterers (30/40) |
| Product Quality (Tayyib) | 100 | Rejects VSM |
| Transparency | 67 | Charter + company list (10/15) |

#### Notes

- Charte halal publique sur achahada.com. Liste des entreprises certifiees accessible via le site.

#### Evidence Sources

- achahada.com -- charte halal et liste d'entreprises certifiees

---

### KHALIS HALAL

| Field | Value |
|---|---|
| **ID** | `khalis-halal` |
| **Website** | (none) |
| **Creation Year** | Unknown |
| **Tier** | Strong |
| **Evidence Level** | declared |

#### Scores

| Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|:---:|:---:|:---:|:---:|:---:|
| 95 | 96 | 95 | 93 | 96 |

#### Practice Profile

| Indicator | Value |
|---|:---:|
| controllersAreEmployees | true |
| controllersPresentEachProduction | true |
| hasSalariedSlaughterers | true |
| acceptsMechanicalPoultrySlaughter | false |
| acceptsPoultryElectronarcosis | false |
| acceptsPoultryElectrocutionPostSlaughter | false |
| acceptsStunningForCattleCalvesLambs | false |
| acceptsVsm | false |
| transparencyPublicCharter | false |
| transparencyAuditReports | false |
| transparencyCompanyList | false |
| halal-assessment | true |
| controversyPenalty | 0 |

#### 4-Block Breakdown

| Block | Score | Reasoning |
|---|:---:|---|
| Ritual Validity | 100 | No negative practices (0/52 penalties) |
| Operational Assurance | 100 | All 3 positive indicators (40/40) |
| Product Quality (Tayyib) | 100 | Rejects VSM |
| Transparency | 0 | No public charter, audit reports, or company list (0/15) |

#### Notes

- No public notes available.

#### Evidence Sources

- Communications directes de Khalis Halal

---

### SIDQ

| Field | Value |
|---|---|
| **ID** | `sidq` |
| **Website** | (none) |
| **Creation Year** | 1998 |
| **Tier** | Strong |
| **Evidence Level** | declared |

#### Scores

| Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|:---:|:---:|:---:|:---:|:---:|
| 95 | 96 | 95 | 93 | 96 |

#### Practice Profile

| Indicator | Value |
|---|:---:|
| controllersAreEmployees | true |
| controllersPresentEachProduction | true |
| hasSalariedSlaughterers | true |
| acceptsMechanicalPoultrySlaughter | false |
| acceptsPoultryElectronarcosis | false |
| acceptsPoultryElectrocutionPostSlaughter | false |
| acceptsStunningForCattleCalvesLambs | false |
| acceptsVsm | false |
| transparencyPublicCharter | false |
| transparencyAuditReports | false |
| transparencyCompanyList | false |
| halal-assessment | true |
| controversyPenalty | 0 |

#### 4-Block Breakdown

| Block | Score | Reasoning |
|---|:---:|---|
| Ritual Validity | 100 | No negative practices (0/52 penalties) |
| Operational Assurance | 100 | All 3 positive indicators (40/40) |
| Product Quality (Tayyib) | 100 | Rejects VSM |
| Transparency | 0 | No public charter, audit reports, or company list (0/15) |

#### Notes

- No public notes available.

#### Evidence Sources

- Communications directes de SIDQ

---

### HMC (Halal Monitoring Committee)

| Field | Value |
|---|---|
| **ID** | `halal-monitoring-committee` |
| **Website** | https://www.halalhmc.org |
| **Creation Year** | 2003 |
| **Tier** | Strong |
| **Evidence Level** | verified |

#### Scores

| Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|:---:|:---:|:---:|:---:|:---:|
| 93 | 94 | 95 | 96 | 94 |

#### Practice Profile

| Indicator | Value |
|---|:---:|
| controllersAreEmployees | true |
| controllersPresentEachProduction | true |
| hasSalariedSlaughterers | true |
| acceptsMechanicalPoultrySlaughter | false |
| acceptsPoultryElectronarcosis | false |
| acceptsPoultryElectrocutionPostSlaughter | false |
| acceptsStunningForCattleCalvesLambs | true |
| acceptsVsm | false |
| transparencyPublicCharter | true |
| transparencyAuditReports | true |
| transparencyCompanyList | true |
| halal-assessment | true |
| controversyPenalty | 0 |

#### 4-Block Breakdown

| Block | Score | Reasoning |
|---|:---:|---|
| Ritual Validity | 65 | Accepts stunning for cattle/calves/lambs (-18/52 = 35% penalty) |
| Operational Assurance | 100 | All 3 positive indicators (40/40) |
| Product Quality (Tayyib) | 100 | Rejects VSM |
| Transparency | 100 | Charter + audit reports + company list (15/15) |

#### Notes

- Organisme britannique (UK), 700+ restaurants et boucheries certifies. Accepte le stunning reversible pour bovins uniquement (source: debat-halal.fr, halalhmc.org). Refus strict pour volailles.
- Standards publics (halalhmc.org/standards). Rapports de monitoring publies. Annuaire des entreprises certifiees accessible en ligne.

#### Evidence Sources

- halalhmc.org -- standards publics et rapports de monitoring
- debat-halal.fr -- analyse independante

---

### HALAL SERVICES

| Field | Value |
|---|---|
| **ID** | `halal-services` |
| **Website** | https://www.halal-services.fr |
| **Creation Year** | 2007 |
| **Tier** | Strong |
| **Evidence Level** | declared |

#### Scores

| Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|:---:|:---:|:---:|:---:|:---:|
| 92 | 91 | 92 | 93 | 92 |

#### Practice Profile

| Indicator | Value |
|---|:---:|
| controllersAreEmployees | true |
| controllersPresentEachProduction | true |
| hasSalariedSlaughterers | false |
| acceptsMechanicalPoultrySlaughter | false |
| acceptsPoultryElectronarcosis | false |
| acceptsPoultryElectrocutionPostSlaughter | false |
| acceptsStunningForCattleCalvesLambs | false |
| acceptsVsm | false |
| transparencyPublicCharter | true |
| transparencyAuditReports | false |
| transparencyCompanyList | false |
| halal-assessment | true |
| controversyPenalty | 0 |

#### 4-Block Breakdown

| Block | Score | Reasoning |
|---|:---:|---|
| Ritual Validity | 100 | No negative practices (0/52 penalties) |
| Operational Assurance | 75 | Controllers employed + present, but no salaried slaughterers (30/40) |
| Product Quality (Tayyib) | 100 | Rejects VSM |
| Transparency | 33 | Charter only (5/15) |

#### Notes

- Cahier des charges public accessible sur halal-services.fr.

#### Evidence Sources

- halal-services.fr -- cahier des charges public

---

## Tier 2 — Moderate (Editorial 55--89)

---

### MCI (Muslim Conseil International)

| Field | Value |
|---|---|
| **ID** | `muslim-conseil-international-mci` |
| **Website** | https://www.halal-mci.info |
| **Creation Year** | Unknown |
| **Tier** | Moderate |
| **Evidence Level** | declared |

#### Scores

| Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|:---:|:---:|:---:|:---:|:---:|
| 63 | 59 | 67 | 77 | 60 |

#### Practice Profile

| Indicator | Value |
|---|:---:|
| controllersAreEmployees | true |
| controllersPresentEachProduction | true |
| hasSalariedSlaughterers | false |
| acceptsMechanicalPoultrySlaughter | false |
| acceptsPoultryElectronarcosis | true |
| acceptsPoultryElectrocutionPostSlaughter | true |
| acceptsStunningForCattleCalvesLambs | false |
| acceptsVsm | true |
| transparencyPublicCharter | false |
| transparencyAuditReports | false |
| transparencyCompanyList | false |
| halal-assessment | false |
| controversyPenalty | 0 |

#### 4-Block Breakdown

| Block | Score | Reasoning |
|---|:---:|---|
| Ritual Validity | 73 | Accepts electronarcosis (-12) + post-slaughter electrocution (-2) = 14/52 penalty |
| Operational Assurance | 75 | Controllers employed + present, but no salaried slaughterers (30/40) |
| Product Quality (Tayyib) | 0 | Accepts VSM |
| Transparency | 0 | No public charter, audit reports, or company list (0/15) |

#### Notes

- No public notes available.

#### Evidence Sources

- halal-mci.info -- site officiel

---

## Tier 3 — Caution (Editorial 20--54)

---

### ARGML (Mosquee de Lyon)

| Field | Value |
|---|---|
| **ID** | `argml-mosquee-de-lyon` |
| **Website** | https://argml.com |
| **Creation Year** | 1995 |
| **Tier** | Caution |
| **Evidence Level** | verified |

#### Scores

| Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|:---:|:---:|:---:|:---:|:---:|
| 51 | 51 | 55 | 55 | 51 |

#### Practice Profile

| Indicator | Value |
|---|:---:|
| controllersAreEmployees | true |
| controllersPresentEachProduction | true |
| hasSalariedSlaughterers | true |
| acceptsMechanicalPoultrySlaughter | false |
| acceptsPoultryElectronarcosis | true |
| acceptsPoultryElectrocutionPostSlaughter | true |
| acceptsStunningForCattleCalvesLambs | true |
| acceptsVsm | true |
| transparencyPublicCharter | false |
| transparencyAuditReports | false |
| transparencyCompanyList | false |
| halal-assessment | false |
| controversyPenalty | 0 |

#### 4-Block Breakdown

| Block | Score | Reasoning |
|---|:---:|---|
| Ritual Validity | 38 | Accepts electronarcosis (-12) + post-slaughter elec (-2) + stunning (-18) = 32/52 penalty |
| Operational Assurance | 100 | All 3 positive indicators (40/40) |
| Product Quality (Tayyib) | 0 | Accepts VSM |
| Transparency | 0 | No public charter, audit reports, or company list (0/15) |

#### Notes

- ~80 controleurs rituels salaries de l'ARGML, independants des abattoirs (source: argml.com/argml/, video TikTok Isla Delice/ARGML). Sacrificateurs = salaries des abattoirs mais agrees et supervises par l'ARGML.
- Accepte l'electronarcose sous conditions strictes (parametres bas, test de reveil). S'est separee de Bernard Royal Dauphine en dec. 2021 quand les normes UE ont impose des parametres trop eleves tuant les volailles (al-kanz.org, dec. 2021). Preuve de rigueur dans l'application de ses standards.
- Certifie Isla Delice -- produits contenant de la VSM (viande separee mecaniquement).

#### Evidence Sources

- argml.com -- charte et presentation officielle
- al-kanz.org -- enquetes independantes (2021)
- video TikTok Isla Delice/ARGML

---

## Tier 4 — Weak (Editorial < 20)

---

### HALAL POLSKA

| Field | Value |
|---|---|
| **ID** | `halal-polska` |
| **Website** | https://www.halal.biz.pl |
| **Creation Year** | 2005 |
| **Tier** | Weak |
| **Evidence Level** | declared |

#### Scores

| Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|:---:|:---:|:---:|:---:|:---:|
| 10 | 8 | 16 | 24 | 9 |

#### Practice Profile

| Indicator | Value |
|---|:---:|
| controllersAreEmployees | true |
| controllersPresentEachProduction | false |
| hasSalariedSlaughterers | true |
| acceptsMechanicalPoultrySlaughter | true |
| acceptsPoultryElectronarcosis | true |
| acceptsPoultryElectrocutionPostSlaughter | true |
| acceptsStunningForCattleCalvesLambs | true |
| acceptsVsm | true |
| transparencyPublicCharter | false |
| transparencyAuditReports | false |
| transparencyCompanyList | false |
| halal-assessment | false |
| controversyPenalty | 0 |

#### 4-Block Breakdown

| Block | Score | Reasoning |
|---|:---:|---|
| Ritual Validity | 0 | All 4 negative ritual indicators active: mechanical (-20) + stunning (-18) + electronarcosis (-12) + post-slaughter elec (-2) = 52/52 penalty |
| Operational Assurance | 63 | Controllers employed + salaried slaughterers, but NOT present each production (25/40) |
| Product Quality (Tayyib) | 0 | Accepts VSM |
| Transparency | 0 | No public charter, audit reports, or company list (0/15) |

#### Notes

- No public notes available.

#### Evidence Sources

- halal.biz.pl -- site officiel

---

### ARRISSALA

| Field | Value |
|---|---|
| **ID** | `arrissala` |
| **Website** | https://www.arrissala.org |
| **Creation Year** | 1993 |
| **Tier** | Weak |
| **Evidence Level** | inferred |

#### Scores

| Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|:---:|:---:|:---:|:---:|:---:|
| 3 | 2 | 4 | 8 | 2 |

#### Practice Profile

| Indicator | Value |
|---|:---:|
| controllersAreEmployees | false |
| controllersPresentEachProduction | false |
| hasSalariedSlaughterers | false |
| acceptsMechanicalPoultrySlaughter | true |
| acceptsPoultryElectronarcosis | true |
| acceptsPoultryElectrocutionPostSlaughter | true |
| acceptsStunningForCattleCalvesLambs | true |
| acceptsVsm | false |
| transparencyPublicCharter | false |
| transparencyAuditReports | false |
| transparencyCompanyList | false |
| halal-assessment | false |
| controversyPenalty | 0 |

#### 4-Block Breakdown

| Block | Score | Reasoning |
|---|:---:|---|
| Ritual Validity | 0 | All 4 negative ritual indicators active: mechanical (-20) + stunning (-18) + electronarcosis (-12) + post-slaughter elec (-2) = 52/52 penalty |
| Operational Assurance | 0 | No positive indicators (0/40) |
| Product Quality (Tayyib) | 100 | Rejects VSM |
| Transparency | 0 | No public charter, audit reports, or company list (0/15) |

#### Notes

- Interdit la VSM dans sa charte (source: al-kanz.org, 2010 -- Arrissala, Altakwa et Achahada considerent la VSM comme haram).

#### Evidence Sources

- al-kanz.org -- article comparatif (2010)
- arrissala.org

---

### ACMIF (Mosquee d'Evry)

| Field | Value |
|---|---|
| **ID** | `acmif-mosquee-d-evry` |
| **Website** | https://www.mosquee-evry.fr |
| **Creation Year** | 1996 |
| **Tier** | Weak |
| **Evidence Level** | inferred |

#### Scores

| Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|:---:|:---:|:---:|:---:|:---:|
| 1 | 1 | 2 | 5 | 1 |

#### Practice Profile

| Indicator | Value |
|---|:---:|
| controllersAreEmployees | false |
| controllersPresentEachProduction | false |
| hasSalariedSlaughterers | false |
| acceptsMechanicalPoultrySlaughter | true |
| acceptsPoultryElectronarcosis | true |
| acceptsPoultryElectrocutionPostSlaughter | true |
| acceptsStunningForCattleCalvesLambs | true |
| acceptsVsm | true |
| transparencyPublicCharter | false |
| transparencyAuditReports | false |
| transparencyCompanyList | false |
| halal-assessment | false |
| controversyPenalty | 0 |

#### 4-Block Breakdown

| Block | Score | Reasoning |
|---|:---:|---|
| Ritual Validity | 0 | All 4 negative ritual indicators active (52/52 penalty) |
| Operational Assurance | 0 | No positive indicators (0/40) |
| Product Quality (Tayyib) | 0 | Accepts VSM |
| Transparency | 0 | No public charter, audit reports, or company list (0/15) |

#### Notes

- Meme cahier des charges que la Mosquee de Paris (SFCVH). Controleurs non salaries -- choisis parmi les employes de l'entreprise certifiee ou detaches par la mosquee (questionhalal.com).

#### Evidence Sources

- questionhalal.com -- rapport communautaire
- mosquee-evry.fr

---

### ALAMANE

| Field | Value |
|---|---|
| **ID** | `alamane` |
| **Website** | (none) |
| **Creation Year** | 1999 |
| **Tier** | Weak |
| **Evidence Level** | inferred |

#### Scores

| Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|:---:|:---:|:---:|:---:|:---:|
| 1 | 1 | 2 | 5 | 1 |

#### Practice Profile

| Indicator | Value |
|---|:---:|
| controllersAreEmployees | false |
| controllersPresentEachProduction | false |
| hasSalariedSlaughterers | false |
| acceptsMechanicalPoultrySlaughter | true |
| acceptsPoultryElectronarcosis | true |
| acceptsPoultryElectrocutionPostSlaughter | true |
| acceptsStunningForCattleCalvesLambs | true |
| acceptsVsm | true |
| transparencyPublicCharter | false |
| transparencyAuditReports | false |
| transparencyCompanyList | false |
| halal-assessment | false |
| controversyPenalty | 0 |

#### 4-Block Breakdown

| Block | Score | Reasoning |
|---|:---:|---|
| Ritual Validity | 0 | All 4 negative ritual indicators active (52/52 penalty) |
| Operational Assurance | 0 | No positive indicators (0/40) |
| Product Quality (Tayyib) | 0 | Accepts VSM |
| Transparency | 0 | No public charter, audit reports, or company list (0/15) |

#### Notes

- No public notes available.

#### Evidence Sources

- Associations communautaires halal

---

### HALAL CORRECT

| Field | Value |
|---|---|
| **ID** | `halal-correct` |
| **Website** | https://www.halalcorrect.com |
| **Creation Year** | 1999 |
| **Tier** | Weak |
| **Evidence Level** | inferred |

#### Scores

| Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|:---:|:---:|:---:|:---:|:---:|
| 1 | 1 | 2 | 5 | 1 |

#### Practice Profile

| Indicator | Value |
|---|:---:|
| controllersAreEmployees | false |
| controllersPresentEachProduction | false |
| hasSalariedSlaughterers | false |
| acceptsMechanicalPoultrySlaughter | true |
| acceptsPoultryElectronarcosis | true |
| acceptsPoultryElectrocutionPostSlaughter | true |
| acceptsStunningForCattleCalvesLambs | true |
| acceptsVsm | true |
| transparencyPublicCharter | false |
| transparencyAuditReports | false |
| transparencyCompanyList | false |
| halal-assessment | false |
| controversyPenalty | 0 |

#### 4-Block Breakdown

| Block | Score | Reasoning |
|---|:---:|---|
| Ritual Validity | 0 | All 4 negative ritual indicators active (52/52 penalty) |
| Operational Assurance | 0 | No positive indicators (0/40) |
| Product Quality (Tayyib) | 0 | Accepts VSM |
| Transparency | 0 | No public charter, audit reports, or company list (0/15) |

#### Notes

- No public notes available.

#### Evidence Sources

- halalcorrect.com

---

### Islamic Centre Aachen

| Field | Value |
|---|---|
| **ID** | `islamic-centre-aachen` |
| **Website** | https://www.halal-europe.com |
| **Creation Year** | Unknown |
| **Tier** | Weak |
| **Evidence Level** | inferred |

#### Scores

| Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|:---:|:---:|:---:|:---:|:---:|
| 1 | 1 | 2 | 5 | 1 |

#### Practice Profile

| Indicator | Value |
|---|:---:|
| controllersAreEmployees | false |
| controllersPresentEachProduction | false |
| hasSalariedSlaughterers | false |
| acceptsMechanicalPoultrySlaughter | true |
| acceptsPoultryElectronarcosis | true |
| acceptsPoultryElectrocutionPostSlaughter | true |
| acceptsStunningForCattleCalvesLambs | true |
| acceptsVsm | true |
| transparencyPublicCharter | false |
| transparencyAuditReports | false |
| transparencyCompanyList | false |
| halal-assessment | false |
| controversyPenalty | 0 |

#### 4-Block Breakdown

| Block | Score | Reasoning |
|---|:---:|---|
| Ritual Validity | 0 | All 4 negative ritual indicators active (52/52 penalty) |
| Operational Assurance | 0 | No positive indicators (0/40) |
| Product Quality (Tayyib) | 0 | Accepts VSM |
| Transparency | 0 | No public charter, audit reports, or company list (0/15) |

#### Notes

- No public notes available.

#### Evidence Sources

- halal-europe.com

---

### AFCAI

| Field | Value |
|---|---|
| **ID** | `afcai` |
| **Website** | https://www.afcai.com |
| **Creation Year** | 1992 |
| **Tier** | Weak |
| **Evidence Level** | inferred |

#### Scores

| Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|:---:|:---:|:---:|:---:|:---:|
| 0 | 0 | 1 | 2 | 0 |

#### Practice Profile

| Indicator | Value |
|---|:---:|
| controllersAreEmployees | false |
| controllersPresentEachProduction | false |
| hasSalariedSlaughterers | false |
| acceptsMechanicalPoultrySlaughter | true |
| acceptsPoultryElectronarcosis | true |
| acceptsPoultryElectrocutionPostSlaughter | true |
| acceptsStunningForCattleCalvesLambs | true |
| acceptsVsm | true |
| transparencyPublicCharter | false |
| transparencyAuditReports | false |
| transparencyCompanyList | false |
| halal-assessment | false |
| controversyPenalty | -5 |

#### 4-Block Breakdown

| Block | Score | Reasoning |
|---|:---:|---|
| Ritual Validity | 0 | All 4 negative ritual indicators active (52/52 penalty) |
| Operational Assurance | 0 | No positive indicators (0/40) |
| Product Quality (Tayyib) | 0 | Accepts VSM |
| Transparency | 0 | No public charter, audit reports, or company list (0/15) |

#### Events

- **controversyPenalty: -5** -- Additional penalty applied for documented controversies.

#### Notes

- Certifie Doux -- abattage mecanique industriel sans controle permanent. Accepte que les sacrificateurs soient des 'Gens du Livre' (non-musulmans), position tres controversee (al-kanz.org, 2010).

#### Evidence Sources

- al-kanz.org -- articles et enquetes (2010)
- afcai.com

---

### SFCVH (Mosquee de Paris)

| Field | Value |
|---|---|
| **ID** | `sfcvh-mosquee-de-paris` |
| **Website** | https://www.sfcvh.com |
| **Creation Year** | 1994 |
| **Tier** | Weak |
| **Evidence Level** | inferred |

#### Scores

| Editorial | Hanafi | Shafi'i | Maliki | Hanbali |
|:---:|:---:|:---:|:---:|:---:|
| 0 | 0 | 0 | 0 | 0 |

#### Practice Profile

| Indicator | Value |
|---|:---:|
| controllersAreEmployees | false |
| controllersPresentEachProduction | false |
| hasSalariedSlaughterers | false |
| acceptsMechanicalPoultrySlaughter | true |
| acceptsPoultryElectronarcosis | true |
| acceptsPoultryElectrocutionPostSlaughter | true |
| acceptsStunningForCattleCalvesLambs | true |
| acceptsVsm | true |
| transparencyPublicCharter | false |
| transparencyAuditReports | false |
| transparencyCompanyList | false |
| halal-assessment | false |
| controversyPenalty | -15 |

#### 4-Block Breakdown

| Block | Score | Reasoning |
|---|:---:|---|
| Ritual Validity | 0 | All 4 negative ritual indicators active (52/52 penalty) |
| Operational Assurance | 0 | No positive indicators (0/40) |
| Product Quality (Tayyib) | 0 | Accepts VSM |
| Transparency | 0 | No public charter, audit reports, or company list (0/15) |

#### Events

- **controversyPenalty: -15** -- Severe penalty for multiple documented controversies.
- **Affaire Herta (jan. 2011)**: Analyses Eurofins revelent traces ADN porc dans Knacki Halal certifiee SFCVH. Contre-expertise Genetic ID contredit. Herta abandonne sa gamme halal en 2012. Source: al-kanz.org/2011/01/25/herta-halal-analyses
- **Enquete L'Opinion (2015)**: Societe privee de 3 salaries monopolise la certification export vers l'Algerie sans controleurs terrain. Source: al-kanz.org/2016/03/18/mosquee-paris-sfcvh/
- **Rupture GMP (juin 2022)**: Rupture definitive entre la Grande Mosquee de Paris et la SFCVH. La GMP certifie desormais en direct. Source: grandemosqueedeparis.fr/post/communique

#### Notes

- Affaire Herta (jan. 2011) : analyses Eurofins revelent traces ADN porc dans Knacki Halal certifiee SFCVH. Contre-expertise Genetic ID contredit. Herta abandonne sa gamme halal en 2012.
- Enquete L'Opinion (2015) : societe privee de 3 salaries monopolise la certification export vers l'Algerie sans controleurs terrain.
- Juin 2022 : rupture definitive entre la Grande Mosquee de Paris et la SFCVH. La GMP certifie desormais en direct.

#### Evidence Sources

- al-kanz.org -- enquetes (2011, 2016)
- L'Opinion -- investigation (2015)
- grandemosqueedeparis.fr -- communique (2022)

---

## Summary Table

| # | Certifier | Tier | Editorial | Ritual | Ops | Tayyib | Transparency | Evidence | Controversy |
|:---:|---|---|:---:|:---:|:---:|:---:|:---:|---|:---:|
| 1 | European Halal Trust | Strong | 100 | 100 | 100 | 100 | 100 | verified | 0 |
| 2 | ALTAKWA | Strong | 97 | 100 | 100 | 100 | 33 | declared | 0 |
| 3 | AVS | Strong | 96 | 100 | 100 | 0 | 67 | verified | 0 |
| 4 | ACHAHADA | Strong | 95 | 100 | 75 | 100 | 67 | declared | 0 |
| 5 | KHALIS HALAL | Strong | 95 | 100 | 100 | 100 | 0 | declared | 0 |
| 6 | SIDQ | Strong | 95 | 100 | 100 | 100 | 0 | declared | 0 |
| 7 | HMC | Strong | 93 | 65 | 100 | 100 | 100 | verified | 0 |
| 8 | HALAL SERVICES | Strong | 92 | 100 | 75 | 100 | 33 | declared | 0 |
| 9 | MCI | Moderate | 63 | 73 | 75 | 0 | 0 | declared | 0 |
| 10 | ARGML | Caution | 51 | 38 | 100 | 0 | 0 | verified | 0 |
| 11 | HALAL POLSKA | Weak | 10 | 0 | 63 | 0 | 0 | declared | 0 |
| 12 | ARRISSALA | Weak | 3 | 0 | 0 | 100 | 0 | inferred | 0 |
| 13 | ACMIF | Weak | 1 | 0 | 0 | 0 | 0 | inferred | 0 |
| 14 | ALAMANE | Weak | 1 | 0 | 0 | 0 | 0 | inferred | 0 |
| 15 | HALAL CORRECT | Weak | 1 | 0 | 0 | 0 | 0 | inferred | 0 |
| 16 | Islamic Centre Aachen | Weak | 1 | 0 | 0 | 0 | 0 | inferred | 0 |
| 17 | AFCAI | Weak | 0 | 0 | 0 | 0 | 0 | inferred | -5 |
| 18 | SFCVH | Weak | 0 | 0 | 0 | 0 | 0 | inferred | -15 |
