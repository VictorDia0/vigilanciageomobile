import * as Location from "expo-location";
import { distanciaKm, isWithinRadius, type Coordenadas } from "@/src/utils/geo";

export type { Coordenadas };

export interface PosicaoAtual extends Coordenadas {
  /** true quando o provider de localização do dispositivo está mockado (GPS falso) */
  mocked: boolean;
}

const RAIO_PADRAO_KM = 30;

async function pedirPermissao(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

async function getCurrentPosition(): Promise<PosicaoAtual> {
  const concedida = await pedirPermissao();
  if (!concedida) {
    throw new Error("Permissão de localização negada.");
  }

  const posicao = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: posicao.coords.latitude,
    longitude: posicao.coords.longitude,
    mocked: posicao.mocked ?? false,
  };
}

export const locationService = {
  pedirPermissao,
  getCurrentPosition,
  distanciaKm,
  isWithinRadius: (ponto: Coordenadas, centro: Coordenadas, raioKm: number = RAIO_PADRAO_KM) =>
    isWithinRadius(ponto, centro, raioKm),
};
