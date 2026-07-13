import { api } from "@/src/services/api";
import type {
  AbrirVisitaPayload,
  RegistrarImovelPayload,
  Visita,
} from "@/src/types/visita";
import { Imovel } from "../types/imovel";

function unwrap<T>(res: any): T {
  return res.data?.data ?? res.data;
}

async function encerrarQuadra(quadraId: number): Promise<void> {
  await api.patch(`/quadras/${quadraId}/status`, { status: "concluida" });
}

async function buscarVisitaAberta(
  quadraId: number,
  tratamentoId: number
): Promise<Visita | null> {
  try {
    const res = await api.get("/visitas", {
      params: { quadra_id: quadraId, tratamento_id: tratamentoId },
    });
    console.log("[buscarVisitaAberta] resposta:", JSON.stringify(res.data));
    const lista: Visita[] = unwrap<Visita[]>(res) ?? [];
    return lista.find((v) =>
      v.status?.value === "aberta" || v.status?.value === "em_andamento"
    ) ?? null;
  } catch (err: any) {
    console.log("[buscarVisitaAberta] erro:", err?.response?.status, err?.message);
    return null;
  }
}

// ─── Visitas ──────────────────────────────────────────────────────────────────

async function abrirVisita(payload: AbrirVisitaPayload): Promise<Visita> {
  const res = await api.post("/visitas", payload);
  return unwrap<Visita>(res);
}

async function registrarImovel(
  visitaId: number,
  payload: RegistrarImovelPayload
): Promise<Visita> {
  const res = await api.post(`/visitas/${visitaId}/imoveis`, payload);
  return unwrap<Visita>(res);
}

async function fecharVisita(visitaId: number): Promise<Visita> {
  const res = await api.patch(`/visitas/${visitaId}/fechar`, {
    confirmar: true,
  });
  return unwrap<Visita>(res);
}

// ─── Imóveis ──────────────────────────────────────────────────────────────────

interface CriarImovelPayload {
  quadra_id: number;
  logradouro: string;
  numero: string | null;
  sem_numero: boolean;
  tipo_imovel: string;
}

async function criarImovel(payload: CriarImovelPayload): Promise<Imovel> {
  const res = await api.post("/imoveis", payload);
  return unwrap<Imovel>(res);
}

async function listarImoveisDaQuadra(quadraId: number): Promise<Imovel[]> {
  const res = await api.get(`/imoveis/quadra/${quadraId}`);
  return unwrap<Imovel[]>(res) ?? [];
}

export const visitaService = {
  abrirVisita,
  registrarImovel,
  fecharVisita,
  criarImovel,
  listarImoveisDaQuadra,
  buscarVisitaAberta,
  encerrarQuadra
};