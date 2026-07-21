import { distanciaKm, isWithinRadius } from "./geo";

describe("distanciaKm / isWithinRadius", () => {
  const centro = { latitude: -23.5505, longitude: -46.6333 }; // São Paulo

  it("returns ~0 for the same point", () => {
    expect(distanciaKm(centro, centro)).toBeCloseTo(0, 3);
  });

  it("is within radius for a nearby point", () => {
    const perto = { latitude: -23.56, longitude: -46.64 };
    expect(isWithinRadius(perto, centro, 30)).toBe(true);
  });

  it("is outside radius for a far point", () => {
    const longe = { latitude: -22.9068, longitude: -43.1729 }; // Rio de Janeiro
    expect(isWithinRadius(longe, centro, 30)).toBe(false);
  });
});
