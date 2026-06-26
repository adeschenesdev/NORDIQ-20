import { describe, it, expect } from "vitest";
import {
  initializeIndex,
  calculateIndex,
  rebalanceIndex,
  computeEffectiveWeights,
  type Constituent,
} from "./index.js";

const constituents: Constituent[] = [
  { ticker: "A.TO", name: "Alpha", sector: "Finance", weight: 0.5 },
  { ticker: "B.TO", name: "Beta", sector: "Matériaux", weight: 0.3 },
  { ticker: "C.TO", name: "Gamma", sector: "Énergie", weight: 0.2 },
];

const pricesT0: Record<string, number> = {
  "A.TO": 100,
  "B.TO": 50,
  "C.TO": 200,
};

describe("initializeIndex", () => {
  it("produit une valeur PR = 1000 exactement à t0", () => {
    const config = initializeIndex(constituents, pricesT0, "2022-01-03");
    const value = calculateIndex(config, pricesT0, "2022-01-03");
    expect(value.pr).toBeCloseTo(1000, 6);
  });

  it("produit une valeur TR = 1000 à t0 quand adjClose = close", () => {
    const config = initializeIndex(constituents, pricesT0, "2022-01-03", 1000, pricesT0);
    const value = calculateIndex(config, pricesT0, "2022-01-03", pricesT0);
    expect(value.tr).toBeCloseTo(1000, 6);
  });

  it("produit une valeur TR = 1000 à t0 même quand adjClose ≠ close", () => {
    // adjClose différents des close (dividendes passés intégrés)
    const adjT0 = { "A.TO": 95, "B.TO": 48, "C.TO": 195 };
    const config = initializeIndex(constituents, pricesT0, "2022-01-03", 1000, adjT0);
    const value = calculateIndex(config, pricesT0, "2022-01-03", adjT0);
    expect(value.tr).toBeCloseTo(1000, 6);
  });

  it("produit des poids effectifs = poids cibles à t0", () => {
    const config = initializeIndex(constituents, pricesT0, "2022-01-03");
    const ew = computeEffectiveWeights(config, pricesT0);
    for (const c of constituents) {
      expect(ew[c.ticker]).toBeCloseTo(c.weight, 6);
    }
  });

  it("lève une erreur si un prix est manquant à t0", () => {
    expect(() =>
      initializeIndex(constituents, { "A.TO": 100 }, "2022-01-03"),
    ).toThrow();
  });
});

describe("calculateIndex", () => {
  it("double les prix → double la valeur de l'indice", () => {
    const config = initializeIndex(constituents, pricesT0, "2022-01-03");
    const doubledPrices = Object.fromEntries(
      Object.entries(pricesT0).map(([k, v]) => [k, v * 2]),
    );
    const value = calculateIndex(config, doubledPrices, "2022-01-04");
    expect(value.pr).toBeCloseTo(2000, 4);
  });

  it("reporte le dernier cours connu si un prix est manquant", () => {
    const config = initializeIndex(constituents, pricesT0, "2022-01-03");
    const partialPrices = { "A.TO": 120, "B.TO": 60 }; // C.TO manquant
    const value = calculateIndex(config, partialPrices, "2022-01-04", undefined, pricesT0);
    // C.TO doit utiliser 200 (cours précédent)
    expect(value.pr).toBeGreaterThan(0);
    expect(value.pricesPR["C.TO"]).toBe(200);
  });

  it("lève une erreur si le prix manque et qu'aucun cours précédent n'existe", () => {
    const config = initializeIndex(constituents, pricesT0, "2022-01-03");
    expect(() =>
      calculateIndex(config, { "A.TO": 110, "B.TO": 55 }, "2022-01-04"),
    ).toThrow();
  });
});

describe("rebalanceIndex", () => {
  it("garantit la continuité : la valeur de l'indice ne change pas lors du rééquilibrage", () => {
    const config = initializeIndex(constituents, pricesT0, "2022-01-03");
    const pricesDay2: Record<string, number> = { "A.TO": 110, "B.TO": 55, "C.TO": 210 };
    const valueBefore = calculateIndex(config, pricesDay2, "2022-06-30");

    // Rééquilibrage avec les mêmes titres mais de nouveaux poids
    const newConstituents: Constituent[] = [
      { ticker: "A.TO", name: "Alpha", sector: "Finance", weight: 0.4 },
      { ticker: "B.TO", name: "Beta", sector: "Matériaux", weight: 0.4 },
      { ticker: "C.TO", name: "Gamma", sector: "Énergie", weight: 0.2 },
    ];
    const newConfig = rebalanceIndex(valueBefore.pr, newConstituents, pricesDay2, "2022-06-30");
    const valueAfter = calculateIndex(newConfig, pricesDay2, "2022-06-30");

    expect(valueAfter.pr).toBeCloseTo(valueBefore.pr, 4);
  });

  it("les nouveaux poids effectifs correspondent aux poids cibles après rééquilibrage", () => {
    const config = initializeIndex(constituents, pricesT0, "2022-01-03");
    const pricesDay2: Record<string, number> = { "A.TO": 110, "B.TO": 55, "C.TO": 210 };
    const valueBefore = calculateIndex(config, pricesDay2, "2022-06-30");

    const newConstituents: Constituent[] = [
      { ticker: "A.TO", name: "Alpha", sector: "Finance", weight: 0.4 },
      { ticker: "B.TO", name: "Beta", sector: "Matériaux", weight: 0.4 },
      { ticker: "C.TO", name: "Gamma", sector: "Énergie", weight: 0.2 },
    ];
    const newConfig = rebalanceIndex(valueBefore.pr, newConstituents, pricesDay2, "2022-06-30");
    const ew = computeEffectiveWeights(newConfig, pricesDay2);

    for (const c of newConstituents) {
      expect(ew[c.ticker]).toBeCloseTo(c.weight, 6);
    }
  });
});
