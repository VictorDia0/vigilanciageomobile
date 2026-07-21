export interface Coordenadas {
  latitude: number;
  longitude: number;
}

const RAIO_TERRA_KM = 6371;

/**
 * Distância em km entre dois pontos via fórmula de Haversine — mesma usada
 * pelo backend em app/Rules/DentroDoRaioDaCidade.php, aqui em TypeScript.
 */
export function distanciaKm(a: Coordenadas, b: Coordenadas): number {
  const toRad = (graus: number) => (graus * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);

  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return RAIO_TERRA_KM * 2 * Math.asin(Math.sqrt(h));
}

export function isWithinRadius(
  ponto: Coordenadas,
  centro: Coordenadas,
  raioKm: number
): boolean {
  return distanciaKm(ponto, centro) <= raioKm;
}
