import { api } from "@/src/services/api";
import type { Ocorrencia, OcorrenciaTipo } from "@/src/types/ocorrencia";
import type {
  AtenderOcorrenciaPayload,
  OcorrenciaAtendimento,
} from "@/src/types/ocorrenciaAtendimento";

function unwrap<T>(res: any): T {
  return res.data?.data ?? res.data;
}

export interface StoreOcorrenciaPayload {
  tipo: OcorrenciaTipo;
  descricao?: string | null;
  latitude: number;
  longitude: number;
  endereco?: string | null;
  data_ocorrencia?: string | null;
}

export interface FotoArquivo {
  uri: string;
  name: string;
  type: string;
}

export const ocorrenciaService = {
  async list(): Promise<Ocorrencia[]> {
    const res = await api.get("/ocorrencias");
    return unwrap<Ocorrencia[]>(res) ?? [];
  },

  async show(id: number): Promise<Ocorrencia> {
    const res = await api.get(`/ocorrencias/${id}`);
    return unwrap<Ocorrencia>(res);
  },

  async store(payload: StoreOcorrenciaPayload): Promise<Ocorrencia> {
    const res = await api.post("/ocorrencias", payload);
    return unwrap<Ocorrencia>(res);
  },

  /** Registra o atendimento em campo e já resolve a ocorrência (numa única
   * chamada — ver docs/superpowers/specs/2026-07-27-visita-ocorrencia-design.md). */
  async atender(
    ocorrenciaId: number,
    dados: AtenderOcorrenciaPayload,
    fotos: FotoArquivo[]
  ): Promise<OcorrenciaAtendimento> {
    const formData = new FormData();
    formData.append("endereco_confirmado", dados.endereco_confirmado);
    formData.append("situacao_encontrada", dados.situacao_encontrada);
    if (dados.nome_morador) formData.append("nome_morador", dados.nome_morador);
    if (dados.telefone_contato) formData.append("telefone_contato", dados.telefone_contato);
    if (dados.descricao) formData.append("descricao", dados.descricao);
    if (dados.latitude != null) formData.append("latitude", String(dados.latitude));
    if (dados.longitude != null) formData.append("longitude", String(dados.longitude));
    fotos.forEach((foto) => {
      formData.append("fotos[]", foto as unknown as Blob);
    });

    const res = await api.post(`/ocorrencias/${ocorrenciaId}/atendimento`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap<OcorrenciaAtendimento>(res);
  },
};
