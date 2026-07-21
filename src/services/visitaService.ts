import { api } from "@/src/services/api";
import type {
  AbrirVisitaPayload,
  RegistrarImovelPayload,
  Visita,
} from "@/src/types/visita";
import { Imovel } from "../types/imovel";
import { cacheLeitura } from "../db/cache";

/** true quando o erro do axios é falta de rede (sem resposta do servidor) */
function isErroDeRede(err: any): boolean {
  return !!err && !err.response;
}

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
    const lista: Visita[] = unwrap<Visita[]>(res) ?? [];
    return lista.find((v) =>
      v.status?.value === "aberta" || v.status?.value === "em_andamento"
    ) ?? null;
  } catch {
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
  /** idempotência p/ sync offline — servidor não duplica no reenvio */
  client_uuid?: string;
}

async function criarImovel(payload: CriarImovelPayload): Promise<Imovel> {
  const res = await api.post("/imoveis", payload);
  return unwrap<Imovel>(res);
}

async function listarImoveisDaQuadra(quadraId: number): Promise<Imovel[]> {
  const chaveCache = `imoveis_quadra_${quadraId}`;
  try {
    const res = await api.get(`/imoveis/quadra/${quadraId}`);
    const imoveis = unwrap<Imovel[]>(res) ?? [];
    cacheLeitura.set(chaveCache, imoveis);
    return imoveis;
  } catch (err) {
    if (isErroDeRede(err)) {
      const cache = cacheLeitura.get<Imovel[]>(chaveCache);
      if (cache) return cache;
    }
    throw err;
  }
}

interface FotoUploadResult {
  path: string;
  url: string;
}

async function uploadFoto(
  visitaId: number,
  arquivo: { uri: string; name: string; type: string }
): Promise<FotoUploadResult> {
  const formData = new FormData();
  formData.append("foto", arquivo as unknown as Blob);

  const res = await api.post(`/visitas/${visitaId}/fotos`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap<FotoUploadResult>(res);
}

export const visitaService = {
  abrirVisita,
  registrarImovel,
  fecharVisita,
  criarImovel,
  listarImoveisDaQuadra,
  buscarVisitaAberta,
  encerrarQuadra,
  uploadFoto,
};