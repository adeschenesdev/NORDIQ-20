# ICQ-20 — Indice Canadien de Qualité

## Méthodologie — Version 2.1 (proposition)

**Statut :** proposition de travail
**Changements principaux vs v1 :** abandon de la dimension géographique; **univers élargi à tout le marché canadien** (S&P/TSX Composite, et non plus les seules listes du CASIQ); sélection par secteur des sociétés affichant le meilleur **rendement total** parmi un univers filtré pour la qualité; pondération sectorielle selon l'**importance économique**.

---

## 1. Objectif

L'ICQ-20 est un indice boursier pancanadien qui réunit, dans chaque grand secteur de l'économie, les sociétés canadiennes de qualité ayant le mieux performé. Il vise une diversification sectorielle représentative du marché canadien, sans biais provincial, en privilégiant les meilleurs performeurs plutôt que la seule capitalisation.

---

## 2. Univers admissible

L'univers est l'ensemble des **sociétés canadiennes admissibles cotées au TSX**, opérationnalisé comme l'**indice S&P/TSX Composite** (≈ 220 sociétés, constituées au Canada et cotées à la Bourse de Toronto).

Ce choix **élargit délibérément l'univers au-delà des listes du CASIQ**. Les indices régionaux du CASIQ étant plafonnés en nombre (IQ-30 = 30 titres, IO-40 = 40, IAB-25 = 25, etc.), des sociétés performantes et de qualité en étaient exclues pour de simples raisons de quota régional. Toute société admissible peut désormais être retenue, qu'elle figure ou non dans une liste du CASIQ.

- **Classification sectorielle :** GICS (utilisée aussi bien par le S&P/TSX que par le CASIQ).
- **Le CASIQ** demeure une référence complémentaire utile (étiquetage sectoriel, recoupement des titres), mais sa pondération « contenu régional » n'est pas utilisée.

---

## 3. Filtre d'éligibilité (« qualité »)

Avant tout classement de performance, une société doit satisfaire **tous** les critères suivants. Ce filtre est ce qui distingue l'ICQ-20 d'une simple course aux gagnants récents, et ce qui justifie le mot « Qualité » dans son nom.

- **Rentabilité :** bénéfices positifs sur les 12 derniers mois (idéalement sur les 3 derniers exercices).
- **Taille :** capitalisation boursière au-dessus d'un seuil défini (voir ci-dessous).
- **Liquidité :** volume quotidien moyen suffisant sur les 3 derniers mois.
- **Solidité financière :** bilan raisonnable (p. ex. ratio dette nette/BAIIA sous un seuil défini).
- **Statut :** société ni en cours d'acquisition ni en voie de radiation.

> Ce filtre élimine les minières juniors spéculatives qui dominent un classement de rendement brut, tout en conservant les producteurs établis et rentables.

**Le seuil de taille est désormais le levier principal.** Puisque l'univers couvre tout le TSX, c'est le seuil de capitalisation qui détermine le caractère de l'indice :

- **Profil « grande capitalisation / qualité »** — seuil élevé (p. ex. membres du S&P/TSX 60, ou capitalisation ≥ 10 G$). Conserve les grands piliers (Bombardier, AtkinsRéalis, Constellation, Cameco…) et une volatilité plus modérée.
- **Profil « performance élargie »** — seuil modéré (membre du S&P/TSX Composite, capitalisation ≥ 2 G$). Admet des moyennes capitalisations à très forte performance (Hammond Power, TerraVest, MDA Space…) qui, sur le rendement brut, devancent les grands titres — au prix d'une volatilité plus élevée.

La composition illustrative ci-dessous (Annexe A) utilise le **profil « performance élargie »**.

---

## 4. Cadre et pondération sectoriels

Dix secteurs GICS sont retenus. Le secteur **Santé** est exclu : il représente environ 0,3 % du marché canadien et ne compte aucune grande société de qualité.

La pondération sectorielle reflète l'**importance économique**, approximée par le poids de chaque secteur dans le **S&P/TSX Composite** (au 31 décembre 2025), renormalisé à 100 % après exclusion de la Santé.

| Secteur GICS                  | Poids S&P/TSX (31-12-2025) | Poids ICQ retenu\* |
| ----------------------------- | -------------------------: | -----------------: |
| Finance                       |                     33,1 % |               33 % |
| Matériaux                     |                     18,1 % |               18 % |
| Énergie                       |                     14,8 % |               15 % |
| Industrie                     |                     10,5 % |               11 % |
| Technologies                  |                      9,7 % |               10 % |
| Services publics              |                      3,4 % |              3,5 % |
| Consommation discrétionnaire  |                      3,3 % |                3 % |
| Consommation de base          |                      3,3 % |                3 % |
| Services de communication     |                      2,0 % |                2 % |
| Immobilier                    |                      1,5 % |              1,5 % |
| *(Santé — exclue)*            |                      0,3 % |                  — |

\*Renormalisé à 100 % après exclusion de la Santé; arrondis.

**Plafond sectoriel (optionnel mais recommandé).** Le poids économique concentre fortement l'indice : Finance (33 %) + Matériaux (18 %) + Énergie (15 %) = 66 % dans trois secteurs. Si une meilleure répartition est souhaitée, plafonner chaque secteur (p. ex. 22–25 %) et redistribuer l'excédent au prorata des autres secteurs.

---

## 5. Sélection des sociétés

- **Mesure de performance :** rendement **total** (variation du cours + dividendes réinvestis). **Fenêtre retenue par défaut : 3 ans** (cohérente avec le classement public TSX30, qui sert de référence). Une fenêtre de 5 ans relèverait sensiblement l'Énergie (forte reprise depuis 2020); la fenêtre exacte demeure un paramètre ajustable.
- **Procédure :** dans chaque secteur, classer les sociétés **éligibles** (section 3) par rendement total décroissant, puis retenir les *N* premières.
- **Nombre de sociétés par secteur (*N*) :** proportionnel au poids du secteur, de façon qu'aucune société ne dépasse le plafond individuel (~8 %). Les grands secteurs comptent donc plus de titres que les petits.

| Secteur          | Poids | *N* | Poids par société |
| ---------------- | ----: | --: | ----------------: |
| Finance          |  33 % |   5 |             6,6 % |
| Matériaux        |  18 % |   3 |             6,0 % |
| Énergie          |  15 % |   2 |             7,5 % |
| Industrie        |  11 % |   2 |             5,5 % |
| Technologies     |  10 % |   2 |             5,0 % |
| Services publics | 3,5 % |   1 |             3,5 % |
| Cons. discrét.   |   3 % |   1 |               3 % |
| Cons. de base    |   3 % |   1 |               3 % |
| Communication    |   2 % |   1 |               2 % |
| Immobilier       | 1,5 % |   1 |             1,5 % |

Total : **19 sociétés**.

---

## 6. Pondération des sociétés

- **À l'intérieur d'un secteur :** poids égal entre les *N* sociétés (simple et robuste), ou proportionnel au rendement si une inclinaison « momentum » est voulue.
- **Plafond individuel :** environ 8 % (ajustable). C'est ce plafond qui détermine le nombre minimal de titres par secteur.

---

## 7. Calcul de l'indice

L'indice est calculé comme une **somme de rendements pondérés**, avec un **diviseur** assurant la continuité :

```
ICQ20_t = 1000 × ( Σ_i [ w_i × Prix_i(t) / Prix_i(t_réf) ] ) / D_t
```

où :

- **Prix_i(t)** = cours de clôture **brut** de la société *i* (et non ajusté). Les fractionnements, dividendes spéciaux et changements de composition sont absorbés par l'ajustement du diviseur, ce qui **fige l'historique** de l'indice.
- **w_i** = poids cible de la société *i* (Σ w_i = 1), fixé au dernier rééquilibrage.
- **t_réf** = date du dernier rééquilibrage.
- **D_t** = diviseur, ajusté à chaque rééquilibrage et à chaque action de société pour éviter toute discontinuité artificielle.

> Cette formulation produit exactement les pondérations cibles et évite l'erreur de la v1, où l'usage de « poids » exprimés en pourcentage dans une somme pondérée par les prix ne reproduisait pas les pondérations voulues.

---

## 8. Valeur initiale

```
ICQ-20 = 1000 points
```

---

## 9. Rééquilibrage

Révision complète **semestrielle**, alignée sur le calendrier du CASIQ (3ᵉ vendredi d'avril et d'octobre). À chaque révision : recalcul des poids sectoriels, du classement de performance, de la composition et des poids individuels; ajustement du diviseur.

---

## 10. Critères de remplacement

Une société est retirée et remplacée par la mieux classée admissible de son secteur lorsqu'elle :

- est acquise ou en voie de l'être;
- est radiée de la cote;
- ne respecte plus le filtre d'éligibilité (section 3);
- voit sa liquidité devenir insuffisante.

---

## 11. Variantes publiées

- **ICQ-20 PR (Price Return)** — variation des cours seulement.
- **ICQ-20 TR (Total Return)** — dividendes réinvestis à la date ex-dividende, au niveau de l'indice.

---

## 12. Limites et avertissements

- **Sélection rétrospective.** L'indice privilégie les gagnants récents. Sur 3 ans, le marché canadien a été dominé par l'or (≈ 18 des 30 sociétés du TSX30 2025 sont des minières), d'où un biais cyclique/momentum, particulièrement en Matériaux. Les performances passées ne préjugent pas des performances futures, et un panier de gagnants récents comporte un risque de retour à la moyenne.
- **Profil « performance élargie ».** En admettant des moyennes capitalisations très performantes, l'indice gagne en rendement passé mais perd en stabilité; relever le seuil de taille (profil « grande capitalisation ») produit un indice plus conforme à un mandat de qualité.
- **Document méthodologique, non un conseil de placement.**

---

## Annexe A — Composition illustrative (juin 2026, provisoire)

> **Statut : ébauche.** Univers élargi à tout le S&P/TSX Composite, **profil « performance élargie »** (seuil de taille modéré). La composition combine le classement TSX30 (rendement total sur 3 ans, données au 30 juin 2025) pour les secteurs qui y sont représentés, et des performeurs pluriannuels connus pour les autres. Elle doit être confirmée par un **filtrage du rendement total sur la fenêtre retenue, appliqué à tout l'univers**, après le filtre d'éligibilité. Les sociétés entre parenthèses sont des rechanges — dont les grands titres, si vous préférez le profil « grande capitalisation ».

| Secteur (poids) | Sociétés retenues (poids individuel) | Rechanges |
| --- | --- | --- |
| **Finance (33 %)** | Fairfax (FFH), Banque Nationale (NA), Brookfield (BN), Manuvie (MFC), Intact (IFC) — 6,6 % ch. | Banque Royale (RY), Sun Life (SLF) |
| **Matériaux (18 %)** | Kinross (K), Lundin Gold (LUG), Alamos Gold (AGI) — 6,0 % ch. | Agnico Eagle (AEM), Wheaton (WPM), Franco-Nevada (FNV), Cameco (CCO) |
| **Énergie (15 %)** | Canadian Natural (CNQ), Imperial Oil (IMO) — 7,5 % ch. | Cameco (CCO), Tourmaline (TOU), Cenovus (CVE) |
| **Industrie (11 %)** | Hammond Power (HPS.A), TerraVest (TVK) — 5,5 % ch. | Bombardier (BBD.B), AtkinsRéalis (ATRL), WSP (WSP) |
| **Technologies (10 %)** | Celestica (CLS), MDA Space (MDA) — 5,0 % ch. | Shopify (SHOP), Constellation Software (CSU, qualité) |
| **Services publics (3,5 %)** | Hydro One (H) | AltaGas (ALA), Capital Power (CPX) |
| **Cons. discrétionnaire (3 %)** | Dollarama (DOL) | Aritzia (ATZ), Gildan (GIL) |
| **Cons. de base (3 %)** | Loblaw (L) | Couche-Tard (ATD), Metro (MRU) |
| **Communication (2 %)** | Québecor (QBR.B) | *(secteur faible — télécoms en recul)* |
| **Immobilier (1,5 %)** | FirstService (FSV) | Colliers (CIGI) |

**Total : 19 sociétés, 100 %.**

> Note sur les Matériaux : trois titres aurifères concentrent ~18 % de l'indice sur un pari de momentum sur l'or. Pour réduire ce risque, envisager de remplacer un producteur par une société de redevances (Wheaton ou Franco-Nevada) ou par un producteur d'une autre filière (p. ex. Cameco, uranium), afin de diversifier au-delà de l'or.

> Note sur l'Industrie et les Technologies : Hammond Power, TerraVest et MDA Space entrent grâce à l'élargissement de l'univers et au seuil de taille modéré. Avec un seuil élevé (profil « grande capitalisation »), ils cèdent la place à Bombardier, AtkinsRéalis et Shopify/Constellation.
