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

class GpsTimeoutError extends Error {}

function comTimeoutSilencioso<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new GpsTimeoutError()), ms)),
  ]);
}

export type LocalizacaoDisponivel = {
  disponivel: true;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  mocked: boolean;
};

export type LocalizacaoIndisponivel = {
  disponivel: false;
  motivo: "permission_denied" | "timeout" | "unknown";
};

export type LocalizacaoResultado = LocalizacaoDisponivel | LocalizacaoIndisponivel;

/**
 * Igual a getCurrentPosition, mas nunca lança — usada nos pontos anti-fraude
 * (início/fim de registro de imóvel) onde falha de GPS não pode travar o
 * agente, só virar `gps_disponivel=false` no payload.
 */
async function getCurrentLocationWithMetadata(): Promise<LocalizacaoResultado> {
  const concedida = await pedirPermissao();
  if (!concedida) {
    return { disponivel: false, motivo: "permission_denied" };
  }

  try {
    const posicao = await comTimeoutSilencioso(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      TIMEOUT_GPS_MS
    );
    return {
      disponivel: true,
      latitude: posicao.coords.latitude,
      longitude: posicao.coords.longitude,
      accuracy: posicao.coords.accuracy,
      mocked: posicao.mocked ?? false,
    };
  } catch (err) {
    return {
      disponivel: false,
      motivo: err instanceof GpsTimeoutError ? "timeout" : "unknown",
    };
  }
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
  getCurrentLocationWithMetadata,
  distanciaKm,
  isWithinRadius: (ponto: Coordenadas, centro: Coordenadas, raioKm: number = RAIO_PADRAO_KM) =>
    isWithinRadius(ponto, centro, raioKm),
};
