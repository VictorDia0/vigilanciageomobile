import { api } from "@/src/services/api";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import type { GerarRelatorioPayload, Relatorio } from "@/src/types/relatorio";

function unwrap<T>(res: any): T {
  return res.data?.data ?? res.data;
}

export const relatorioService = {
  async gerar(payload: GerarRelatorioPayload): Promise<Relatorio> {
    const res = await api.post("/relatorios/gerar", payload);
    return unwrap<Relatorio>(res);
  },

  async listar(): Promise<Relatorio[]> {
    const res = await api.get("/relatorios");
    return unwrap<Relatorio[]>(res) ?? [];
  },

  /**
   * Baixa o arquivo do relatório e abre a folha de compartilhamento nativa
   * (o backend serve o binário direto, sem URL pública separada).
   */
  async baixarEAbrir(relatorio: Relatorio): Promise<void> {
    const destino = `${FileSystem.documentDirectory}${relatorio.nome}.${relatorio.formato}`;

    const resposta = await FileSystem.downloadAsync(
      `${api.defaults.baseURL}/relatorios/${relatorio.id}/download`,
      destino,
      { headers: { Accept: "application/octet-stream" } }
    );

    if (resposta.status !== 200) {
      throw new Error("Não foi possível baixar o relatório.");
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(resposta.uri);
    }
  },
};
