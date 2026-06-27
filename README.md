# NORDIQ-20 — Indice Canadien de Qualité

Application web locale qui affiche, conserve et met à jour l'NORDIQ-20, un indice boursier pancanadien de 19 constituants sélectionnés par secteur GICS selon leur rendement total sur 3 ans.

> **⚠ Avertissement** : ceci est un projet personnel éducatif. L'NORDIQ-20 n'est **pas** un produit financier réglementé et ne constitue **pas** un conseil de placement. Les données proviennent de [yahoo-finance2](https://github.com/gadicc/node-yahoo-finance2), une bibliothèque non officielle, non affiliée à Yahoo Finance. Utilisation à des fins personnelles uniquement, dans le respect des conditions d'utilisation de Yahoo.

---

## Sommaire

1. [Architecture](#architecture)
2. [Prérequis](#prérequis)
3. [Installation](#installation)
4. [Initialisation (backfill)](#initialisation-backfill)
5. [Mise à jour quotidienne](#mise-à-jour-quotidienne)
6. [Lancer le site](#lancer-le-site)
7. [Rééquilibrage](#rééquilibrage)
8. [Modifier les constituants ou les poids](#modifier-les-constituants-ou-les-poids)
9. [Méthode de calcul](#méthode-de-calcul)
10. [Alternatives](#alternatives)

---

## Architecture

```
NORDIQ20/
├── data/
│   ├── constituents.json   ← seul fichier à modifier pour changer la composition
│   └── data.json           ← historique + état du diviseur (versionné)
├── src/
│   ├── engine/             ← moteur de calcul (méthode du diviseur)
│   ├── data/               ← fetch Yahoo Finance + store JSON
│   └── scripts/            ← update, backfill, rebalance
└── web/                    ← application React (Vite + Tailwind + Recharts)
```

**Stack** : Node.js 22 · TypeScript · yahoo-finance2 · Vitest · React 18 · Vite · Tailwind CSS v4 · Recharts

---

## Prérequis

- Node.js ≥ 20
- npm ≥ 9
- Connexion Internet (pour récupérer les données Yahoo Finance)

---

## Installation

```bash
cd NORDIQ20
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

## Mise à jour quotidienne

À lancer chaque soir après la clôture de la TSX (16h00 HNE) :

```bash
npm run update
```

Récupère les cours de clôture du jour, calcule PR et TR, et ajoute une ligne à `data/data.json` (idempotent : une même date ne sera jamais dupliquée).

---

## Lancer le site

```bash
cd web
npm run dev
# → http://localhost:5173
```

Le serveur de développement sert automatiquement `data/data.json` via un middleware Vite.

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
  ]
}
```

**Règles** :
- La somme des `weight` doit être égale à **1.0** (100 %)
- Les tickers doivent utiliser le suffixe `.TO` (TSX) et la notation Yahoo avec tiret (ex. `HPS-A.TO`, `QBR-B.TO`)
- Après modification, lancez `npm run verify-tickers` pour valider, puis `npm run rebalance`

---

## Méthode de calcul

L'NORDIQ-20 utilise la **méthode du diviseur** (standard des grands indices boursiers) :

```
NORDIQ20(t) = [ Σ_i  q_i × P_i(t) ]  /  D
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
