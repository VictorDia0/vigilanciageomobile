import {
  outbox,
  type RegistrarImovelOffline,
  type FecharVisitaOffline,
  type EncerrarQuadraOffline,
  type RegistrarRecuperacaoOffline,
  type AtenderOcorrenciaOffline,
} from "../db/outbox";
import { visitaService } from "./visitaService";
import { recuperacaoService } from "./recuperacaoService";
import { ocorrenciaService } from "./ocorrenciaService";

export interface ResultadoSync {
  enviados: number;
  falhas: number;
}

/** true quando o erro do axios é falta de rede (sem resposta do servidor) */
export function isErroDeRede(err: any): boolean {
  return !!err && !err.response;
}

let sincronizando: Promise<ResultadoSync> | null = null;

/**
 * Reprocessa a fila offline em ordem de criação.
 * Chamar: ao abrir o app, ao voltar a conexão e no botão "Sincronizar".
 *
 * Reentrante: o gatilho do NetInfo (reconexão) e o botão manual do Perfil
 * podem disparar ao mesmo tempo — se já houver uma sincronização em
 * andamento, reaproveita a mesma promise em vez de reprocessar a fila em
 * paralelo (o que duplicaria envios).
 */
export function sincronizarPendentes(): Promise<ResultadoSync> {
  if (sincronizando) return sincronizando;
  sincronizando = executarSincronizacao().finally(() => {
    sincronizando = null;
  });
  return sincronizando;
}

async function executarSincronizacao(): Promise<ResultadoSync> {
  const itens = outbox.pendentes();
  let enviados = 0;
  let falhas = 0;

  for (const item of itens) {
    try {
      if (item.tipo === "registrar_imovel") {
        const p = item.payload as RegistrarImovelOffline;

        // Fotos são melhor-esforço: se o upload falhar (ex.: sem rede), o
        // registro segue sem elas em vez de travar a fila inteira.
        let fotos = p.registro.fotos;
        if (!fotos?.length && p.fotosLocais?.length) {
          try {
            const uploads = await Promise.all(
              p.fotosLocais.map((uri, i) =>
                visitaService.uploadFoto(p.visita_id, {
                  uri,
                  name: `foto-${Date.now()}-${i}.jpg`,
                  type: "image/jpeg",
                })
              )
            );
            fotos = uploads.map((u) => u.path);
          } catch {
            // segue sem fotos
          }
        }

        const imovel = await visitaService.criarImovel({
          quadra_id: p.quadra_id,
          client_uuid: item.client_uuid,
          ...p.imovel,
        });
        await visitaService.registrarImovel(p.visita_id, {
          imovel_id: imovel.id,
          ...p.registro,
          fotos,
          situacao: p.registro.situacao as any,
          client_uuid: item.client_uuid,
        });
      } else if (item.tipo === "fechar_visita") {
        const p = item.payload as FecharVisitaOffline;
        await visitaService.fecharVisita(p.visita_id);
      } else if (item.tipo === "encerrar_quadra") {
        const p = item.payload as EncerrarQuadraOffline;
        if (p.visita_id) {
          await visitaService.fecharVisita(p.visita_id);
        }
        await visitaService.encerrarQuadra(p.quadra_id);
      } else if (item.tipo === "registrar_recuperacao") {
        const p = item.payload as RegistrarRecuperacaoOffline;
        await recuperacaoService.registrar(p.imovel_id, p.payload as any);
      } else if (item.tipo === "atender_ocorrencia") {
        const p = item.payload as AtenderOcorrenciaOffline;
        await ocorrenciaService.atender(p.ocorrencia_id, p.dados, p.fotos);
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
