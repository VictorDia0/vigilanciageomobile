import { outbox, type RegistrarImovelOffline } from "../db/outbox";
import { visitaService } from "./visitaService";

export interface ResultadoSync {
  enviados: number;
  falhas: number;
}

/** true quando o erro do axios é falta de rede (sem resposta do servidor) */
export function isErroDeRede(err: any): boolean {
  return !!err && !err.response;
}

/**
 * Reprocessa a fila offline em ordem de criação.
 * Chamar: ao abrir o app, ao voltar a conexão e no botão "Sincronizar".
 */
export async function sincronizarPendentes(): Promise<ResultadoSync> {
  const itens = outbox.pendentes();
  let enviados = 0;
  let falhas = 0;

  for (const item of itens) {
    try {
      if (item.tipo === "registrar_imovel") {
        const p = item.payload as RegistrarImovelOffline;
        const imovel = await visitaService.criarImovel({
          quadra_id: p.quadra_id,
          ...p.imovel,
        });
        await visitaService.registrarImovel(p.visita_id, {
          imovel_id: imovel.id,
          ...p.registro,
          situacao: p.registro.situacao as any,
          client_uuid: item.client_uuid,
        });
      }
      outbox.remover(item.id);
      enviados++;
    } catch (err: any) {
      if (isErroDeRede(err)) {
        // continua sem rede — para tudo, tenta na próxima
        falhas += itens.length - enviados - falhas;
        break;
      }
      // erro de negócio (ex.: quadra concluída): registra e segue
      outbox.registrarErro(item.id, err?.response?.data?.message ?? String(err));
      falhas++;
    }
  }

  return { enviados, falhas };
}

export function totalPendentes(): number {
  return outbox.total();
}
