import { api } from "./api";
import type {
  RecuperacaoPendente,
  RegistrarRecuperacaoPayload,
} from "@/src/types/visita";

function unwrap<T>(res: any): T {
  return res.data?.data ?? res.data;
}

/**
 * Imóveis cuja última situação no tratamento é F (fechado),
 * de todas as quadras do agente — inclusive quadras concluídas.
 * Endpoint documentado em docs/API_BACKEND.md.
 */
async function listarFechados(
  tratamentoId: number
): Promise<RecuperacaoPendente[]> {
  const res = await api.get(`/tratamentos/${tratamentoId}/imoveis-fechados`);
  return unwrap<RecuperacaoPendente[]>(res) ?? [];
}

/**
 * Registra o resultado da revisita (REC, R ou F novamente).
 * Não exige sessão aberta nem quadra em andamento.
 */
async function registrar(
  imovelId: number,
  payload: RegistrarRecuperacaoPayload
): Promise<void> {
  await api.post(`/imoveis/${imovelId}/recuperacao`, payload);
}

export const recuperacaoService = { listarFechados, registrar };
