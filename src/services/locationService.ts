import * as Location from "expo-location";
import { distanciaKm, isWithinRadius, type Coordenadas } from "@/src/utils/geo";

export type { Coordenadas };

export interface PosicaoAtual extends Coordenadas {
  /** true quando o provider de localização do dispositivo está mockado (GPS falso) */
  mocked: boolean;
}

const RAIO_PADRAO_KM = 30;

// Sem timeout, getCurrentPositionAsync pode ficar pendurado indefinidamente
// com sinal fraco — exatamente o cenário de campo mais comum (área
// periférica, dentro de casa). Depois disso, melhor errar rápido e deixar
// o agente tentar de novo do que travar a tela sem explicação.
const TIMEOUT_GPS_MS = 15000;

async function pedirPermissao(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

function comTimeout<T>(promise: Promise<T>, ms: number, mensagemErro: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(mensagemErro)), ms)),
  ]);
}

async function getCurrentPosition(): Promise<PosicaoAtual> {
  const concedida = await pedirPermissao();
  if (!concedida) {
    throw new Error("Permissão de localização negada.");
  }

  const posicao = await comTimeout(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
    TIMEOUT_GPS_MS,
    "Sinal de GPS fraco. Tente se aproximar de uma janela ou área aberta e tente novamente."
  );

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
