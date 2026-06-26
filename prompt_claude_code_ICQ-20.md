# Prompt pour Claude Code — Site web de l'indice ICQ-20

> **Comment l'utiliser :** ouvre un dossier vide, lance `claude` dedans, puis colle tout le texte ci-dessous (à partir de « Tu vas construire… »). Si tu as le fichier `methodologie_ICQ-20_v2.md`, dépose-le aussi dans le dossier — le prompt demande à Claude Code de le lire.

---

Tu vas construire une application web qui **affiche, conserve et met à jour automatiquement** un indice boursier canadien que j'ai conçu : l'**ICQ-20**. Si le fichier `methodologie_ICQ-20_v2.md` est présent dans le dossier, lis-le d'abord : il contient la méthodologie complète. Ce qui suit en résume l'essentiel et précise les exigences techniques.

**Avant de coder, propose-moi un plan d'implémentation par jalons et attends ma validation.** Procède ensuite jalon par jalon, avec des commits clairs.

## 1. Spécification de l'indice (à respecter fidèlement)

- **Valeur de base :** 1000 points à la date de référence (`t0`).
- **19 constituants**, pondérations cibles fixes (somme = 100 %), classés par secteur GICS :

| Secteur GICS | Société | Ticker (Yahoo) | Poids |
| --- | --- | --- | ---: |
| Finance | Fairfax Financial | FFH.TO | 6,6 % |
| Finance | Banque Nationale | NA.TO | 6,6 % |
| Finance | Brookfield Corporation | BN.TO | 6,6 % |
| Finance | Manuvie | MFC.TO | 6,6 % |
| Finance | Intact Financière | IFC.TO | 6,6 % |
| Matériaux | Kinross Gold | K.TO | 6,0 % |
| Matériaux | Lundin Gold | LUG.TO | 6,0 % |
| Matériaux | Alamos Gold | AGI.TO | 6,0 % |
| Énergie | Canadian Natural Resources | CNQ.TO | 7,5 % |
| Énergie | Imperial Oil | IMO.TO | 7,5 % |
| Industrie | Hammond Power Solutions | HPS-A.TO | 5,5 % |
| Industrie | TerraVest Industries | TVK.TO | 5,5 % |
| Technologies | Celestica | CLS.TO | 5,0 % |
| Technologies | MDA Space | MDA.TO | 5,0 % |
| Services publics | Hydro One | H.TO | 3,5 % |
| Cons. discrétionnaire | Dollarama | DOL.TO | 3,0 % |
| Cons. de base | Loblaw | L.TO | 3,0 % |
| Communication | Québecor | QBR-B.TO | 2,0 % |
| Immobilier | FirstService | FSV.TO | 1,5 % |

Mets cette liste dans un **fichier de configuration unique et facile à éditer** (`constituents.json` ou `.ts`) : ticker, nom, secteur, poids cible. Je veux pouvoir changer les titres et les poids sans toucher au code.

- **Devise :** tous les prix sont en CAD (le suffixe `.TO` garantit la cotation TSX en dollars canadiens). N'effectue **aucune** conversion de devise.
- **Tickers à actions multiples :** sur Yahoo, ils s'écrivent avec un tiret (ex. `HPS-A.TO`, `QBR-B.TO`). Vérifie au démarrage que chaque ticker résout bien et signale ceux qui échouent.

## 2. Méthode de calcul (méthode du diviseur — importante)

N'utilise PAS une simple somme pondérée par les prix. Implémente la **méthode du diviseur**, qui produit exactement les poids cibles et reste continue lors des rééquilibrages :

1. À la date de référence `t0`, récupère le cours de clôture `P_i(t0)` de chaque titre.
2. Calcule un **nombre d'unités** par titre : `q_i = w_i / P_i(t0)` (où `w_i` = poids cible, somme = 1). Ainsi `Σ q_i · P_i(t0) = 1`.
3. Fixe le **diviseur** `D` tel que l'indice à `t0` vaille 1000 : avec la normalisation ci-dessus, `D = 0,001`.
4. À toute date `t` : `Indice(t) = ( Σ_i q_i · P_i(t) ) / D`.
5. **Rééquilibrage / changement de constituant :** recalcule les `q_i` à partir des nouveaux poids et des prix du jour, puis ajuste `D` pour que l'indice reste **continu** (`D_nouveau = (Σ q_i_nouveau · P_i) / Indice_juste_avant`). Aucun saut artificiel.

- **Variante Price Return (ICQ-20 PR) :** cours bruts, comme ci-dessus.
- **Variante Total Return (ICQ-20 TR) :** mêmes calculs mais sur des **cours ajustés des dividendes** (champ « adjusted close » du fournisseur). Implémente la variante PR d'abord; la variante TR peut venir en second.

Écris cette logique dans un **module isolé et testé unitairement** (cas : valeur = 1000 à `t0`; poids effectifs = poids cibles à `t0`; continuité après rééquilibrage; gestion d'un prix manquant).

## 3. Données de marché

- Utilise la librairie npm **`yahoo-finance2`** (pas de clé d'API requise) pour les **cotations** et l'**historique** (`historical` / `chart`). Elle gère le suffixe `.TO`.
- **Robustesse obligatoire :** réessais avec backoff, délai entre requêtes pour éviter la limitation de débit, journalisation des échecs, et **tolérance aux données manquantes** (jour férié, titre sans cours : reporter le dernier cours connu et le consigner).
- *Alternatives si Yahoo devient instable (mentionne-les dans le README, ne les implémente pas d'emblée) :* Twelve Data ou Finnhub (avec clé d'API, suffixe TSX selon leur doc), ou un micro-service Python `yfinance`.

## 4. Persistance

Conserve, dans un **`data.json` versionné** (simple, sans serveur) — ou SQLite si tu juges préférable :

- la **configuration figée** au dernier rééquilibrage : `q_i`, diviseur `D`, date `t0`, poids cibles;
- l'**historique quotidien** : date, valeur PR, valeur TR;
- des **métadonnées** : date/heure de dernière mise à jour, source des données.

Les écritures doivent être **idempotentes par date** (ne jamais ajouter deux fois le même jour).

## 5. Mise à jour automatique

- Écris un **script de mise à jour** (`update`) qui : récupère les cours de clôture du jour, calcule PR et TR, ajoute la ligne à l'historique, met à jour les métadonnées.
- **Premier lancement :** propose un mode « backfill » qui reconstruit l'historique depuis `t0` à partir des prix historiques, pour avoir tout de suite un graphique.
- **Planification via GitHub Actions** (cron, gratuit, sans serveur) : exécute le script ~30–60 min après la clôture de la TSX (16 h 00, heure de l'Est) puis **commit** le `data.json` mis à jour. La TSX ferme à 21 h 00 UTC (heure normale) ou 20 h 00 UTC (heure avancée) — choisis un horaire en conséquence (ex. `30 21 * * 1-5`) et documente la nuance d'heure d'été. Ignore les jours sans nouvelle donnée (week-ends, fériés).
- Prévois aussi une **commande manuelle** équivalente (`npm run update`) et une **commande de rééquilibrage** (`npm run rebalance`) qui recalcule `q_i` et `D`.

## 6. Le site web

Page unique, responsive, soignée :

- **Valeur courante de l'indice** + variation du jour (en points et en %), avec un **sélecteur PR / TR**.
- **Graphique historique** (courbe depuis `t0`).
- **Tableau des constituants** : nom, ticker, secteur, poids cible, dernier cours, variation du jour (%), rendement depuis `t0`, et **contribution** au niveau de l'indice.
- **Répartition sectorielle** (graphique des poids par secteur).
- **Horodatage** de la dernière mise à jour et mention de la source des données.

Stack recommandée (tu peux proposer mieux, mais reste simple) : **React + Vite + TypeScript + Tailwind + Recharts**, déployable en statique sur **GitHub Pages** ou **Vercel**, le site lisant le `data.json`. *(Alternative tout-en-un, si je veux une vraie base de données : Next.js + Postgres hébergé (Supabase/Neon) + Vercel Cron — mentionne-la dans le README.)*

## 7. Contraintes et qualité

- **Aucun secret en dur** : variables d'environnement, et un `.env.example`.
- Code **TypeScript typé**, modules clairs (engine de calcul / données / UI séparés), **tests unitaires** sur l'engine.
- **Projet personnel et éducatif** : ajoute un avertissement « ceci n'est pas un conseil de placement » et une note sur le fait que `yahoo-finance2` est une source non officielle (respect des conditions d'utilisation).
- **README complet** : installation, lancement local, backfill, mise à jour, rééquilibrage, déploiement, et comment modifier les constituants/poids.

## 8. Définition de « terminé »

- Le site affiche la valeur courante de l'ICQ-20, le graphique historique, le tableau des constituants et la répartition sectorielle, avec bascule PR/TR.
- La mise à jour quotidienne fonctionne (GitHub Actions) ou est documentée en mode manuel.
- Les tests de l'engine passent; le `data.json` se met à jour de façon idempotente.
- Le README permet à quelqu'un d'autre de tout installer, lancer et déployer.

Commence par me proposer le plan par jalons et la stack définitive, puis attends mon feu vert.
