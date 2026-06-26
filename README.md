# ICQ-20 — Indice Canadien de Qualité

Application web qui affiche, conserve et met à jour automatiquement l'ICQ-20, un indice boursier pancanadien de 19 constituants sélectionnés par secteur GICS selon leur rendement total sur 3 ans.

> **⚠ Avertissement** : ceci est un projet personnel éducatif. L'ICQ-20 n'est **pas** un produit financier réglementé et ne constitue **pas** un conseil de placement. Les données proviennent de [yahoo-finance2](https://github.com/gadicc/node-yahoo-finance2), une bibliothèque non officielle, non affiliée à Yahoo Finance. Utilisation à des fins personnelles uniquement, dans le respect des conditions d'utilisation de Yahoo.

---

## Sommaire

1. [Architecture](#architecture)
2. [Prérequis](#prérequis)
3. [Installation](#installation)
4. [Initialisation (backfill)](#initialisation-backfill)
5. [Mise à jour manuelle](#mise-à-jour-manuelle)
6. [Développement local](#développement-local)
7. [Rééquilibrage](#rééquilibrage)
8. [Modifier les constituants ou les poids](#modifier-les-constituants-ou-les-poids)
9. [Déploiement sur GitHub Pages](#déploiement-sur-github-pages)
10. [Mise à jour automatique (GitHub Actions)](#mise-à-jour-automatique-github-actions)
11. [Méthode de calcul](#méthode-de-calcul)
12. [Alternatives](#alternatives)

---

## Architecture

```
icq20/
├── data/
│   ├── constituents.json   ← seul fichier à modifier pour changer la composition
│   └── data.json           ← historique + état du diviseur (versionné)
├── src/
│   ├── engine/             ← moteur de calcul (méthode du diviseur)
│   ├── data/               ← fetch Yahoo Finance + store JSON
│   └── scripts/            ← update, backfill, rebalance
└── web/                    ← application React (Vite + Tailwind + Recharts)
```

**Stack** : Node.js 22 · TypeScript · yahoo-finance2 · Vitest · React 18 · Vite · Tailwind CSS v4 · Recharts · GitHub Actions · GitHub Pages

---

## Prérequis

- Node.js ≥ 20
- npm ≥ 9
- Connexion Internet (pour récupérer les données Yahoo Finance)

---

## Installation

```bash
git clone <URL-du-dépôt>
cd icq20
npm install
cd web && npm install && cd ..
```

---

## Initialisation (backfill)

À lancer **une seule fois** pour construire l'historique complet depuis une date de référence.

```bash
# Depuis t0 par défaut (2022-01-03)
npm run backfill

# Ou depuis une date personnalisée
npm run backfill -- --from 2023-01-01

# Forcer la réinitialisation du diviseur (recalcul complet)
npm run backfill -- --from 2022-01-03 --reset
```

Le script :
1. Télécharge l'historique Yahoo Finance pour les 19 tickers
2. Initialise le diviseur D à t0 pour que l'indice vaille 1000
3. Calcule PR et TR jour par jour
4. Sauvegarde dans `data/data.json`

---

## Mise à jour manuelle

```bash
npm run update
```

Récupère les cours de clôture du jour, calcule PR et TR, et ajoute une ligne à `data/data.json` (idempotent : une même date ne sera jamais dupliquée).

---

## Développement local

```bash
cd web
npm run dev
# → http://localhost:5173
```

Le serveur de développement sert automatiquement `data/data.json` à l'URL `/data.json` via un middleware Vite.

---

## Rééquilibrage

Un rééquilibrage est effectué semestriellement (3e vendredi d'avril et d'octobre), après révision de la composition dans `data/constituents.json`.

```bash
# Après avoir mis à jour constituents.json :
npm run rebalance
```

Le script :
1. Récupère les cours courants
2. Recalcule les unités `q_i` et le diviseur `D` à partir des nouveaux poids
3. Ajuste `D` pour que la valeur de l'indice reste **continue** (pas de saut artificiel)
4. Met à jour `data/data.json`

---

## Modifier les constituants ou les poids

Éditez uniquement `data/constituents.json` :

```json
{
  "constituents": [
    {
      "ticker": "FFH.TO",
      "name": "Fairfax Financial",
      "sector": "Finance",
      "weight": 0.066
    }
    // ...
  ]
}
```

**Règles** :
- La somme des `weight` doit être égale à **1.0** (100 %)
- Les tickers doivent utiliser le suffixe `.TO` (TSX) et la notation Yahoo avec tiret (ex. `HPS-A.TO`, `QBR-B.TO`)
- Après modification, lancez `npm run verify-tickers` pour valider, puis `npm run rebalance`

---

## Déploiement sur GitHub Pages

### Étape 1 : Pousser sur GitHub

```bash
git remote add origin https://github.com/<votre-compte>/<votre-repo>.git
git push -u origin main
```

### Étape 2 : Activer GitHub Pages

Dans les paramètres du dépôt → **Pages** → Source : **GitHub Actions**

### Étape 3 : Déclencher le déploiement

Le workflow `deploy.yml` se déclenche automatiquement à chaque push sur `main`. Vous pouvez aussi le lancer manuellement depuis l'onglet **Actions**.

**Note sur `base` Vite** : le fichier `web/vite.config.ts` utilise `base: "./"` ce qui rend le site compatible avec n'importe quel sous-chemin GitHub Pages (ex. `https://compte.github.io/repo/`).

---

## Mise à jour automatique (GitHub Actions)

Le workflow `update.yml` s'exécute automatiquement **du lundi au vendredi à 21h30 UTC** :
- **17h30 HNE** (heure normale de l'Est, novembre–mars)
- **16h30 HAE** (heure avancée de l'Est, mars–novembre)

La TSX ferme à 16h00 heure locale dans les deux cas. Ce créneau garantit que les cours de clôture sont disponibles quelle que soit la période de l'année.

Si aucune nouvelle donnée n'est disponible (jour férié, week-end), le workflow se termine sans commit.

### Déclenchement manuel

Depuis l'onglet **Actions** → sélectionner le workflow → **Run workflow**.

### Permissions requises

Le workflow a besoin de l'autorisation `contents: write` pour commiter `data.json`. Dans les paramètres du dépôt → **Actions** → **General** → **Workflow permissions** → cocher **Read and write permissions**.

---

## Méthode de calcul

L'ICQ-20 utilise la **méthode du diviseur** (standard des grands indices boursiers) :

```
ICQ20(t) = [ Σ_i  q_i × P_i(t) ]  /  D
```

où :
- **`q_i`** = unités du titre `i`, calculées à t0 : `q_i = w_i / P_i(t0)`
- **`w_i`** = poids cible (somme = 1)
- **`D`** = diviseur, initialisé à `D = Σ q_i · P_i(t0) / 1000`, puis ajusté à chaque rééquilibrage pour assurer la continuité

**Variante PR (Price Return)** : cours de clôture bruts.  
**Variante TR (Total Return)** : cours ajustés des dividendes (`adjClose`). Un diviseur `trDivisor` distinct est calculé à t0 pour que TR démarre aussi à 1000.

Les deux variantes commencent à **1000 points** à la date de référence t0.

---

## Alternatives

Si Yahoo Finance devient instable ou si vous avez besoin d'une source officielle :

| Fournisseur | Bibliothèque / API | Clé API | Suffixe TSX |
|---|---|---|---|
| **Twelve Data** | API REST | Oui (plan gratuit limité) | `:TSX` (ex. `FFH:TSX`) |
| **Finnhub** | API REST | Oui (plan gratuit) | `TSX:FFH` |
| **yfinance (Python)** | `yfinance` pip | Non | `FFH.TO` (identique) |

Pour yfinance, un micro-service Python peut exposer un endpoint HTTP que `fetch.ts` consomme à la place de yahoo-finance2.

**Alternative complète (base de données)** : Next.js + PostgreSQL (Supabase ou Neon) + Vercel Cron. Plus robuste pour un usage multi-utilisateurs ou une grande quantité de données, au prix d'une complexité accrue.
