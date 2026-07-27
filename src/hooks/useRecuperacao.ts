import { useState, useCallback } from "react";
import { recuperacaoService } from "../services/recuperacaoService";
import { locationService, type PosicaoAtual } from "../services/locationService";
import { outbox, type RegistrarRecuperacaoOffline } from "../db/outbox";
import { isErroDeRede, totalPendentes } from "../services/sync";
import type {
  RecuperacaoPendente,
  RegistrarRecuperacaoPayload,
  SituacaoImovel,
} from "@/src/types/visita";

export interface RecuperacaoFormState {
  situacao: SituacaoImovel | "";
  focos_eliminados: string;
  tratado: boolean;
  quantidade_larvicida: string;
  depositos_tratados: string;
}

export const FORM_RECUPERACAO_VAZIO: RecuperacaoFormState = {
  situacao: "",
  focos_eliminados: "0",
  tratado: false,
  quantidade_larvicida: "",
  depositos_tratados: "",
};

export function useRecuperacao(tratamentoId: number | null) {
  const [pendentes, setPendentes] = useState<RecuperacaoPendente[]>([]);
  const [selecionado, setSelecionado] = useState<RecuperacaoPendente | null>(null);
  const [form, setForm] = useState<RecuperacaoFormState>(FORM_RECUPERACAO_VAZIO);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pendentesSync, setPendentesSync] = useState<number>(0);

  const carregar = useCallback(async () => {
    if (!tratamentoId) return;
    setLoading(true);
    setError(null);
    try {
      const lista = await recuperacaoService.listarFechados(tratamentoId);
      setPendentes(lista);
    } catch {
      setError("Não foi possível carregar os imóveis fechados.");
    } finally {
      setLoading(false);
    }
  }, [tratamentoId]);

  const abrirForm = useCallback((item: RecuperacaoPendente) => {
    setSelecionado(item);
    setForm(FORM_RECUPERACAO_VAZIO);
    setError(null);
    setSuccessMsg(null);
  }, []);

  const fecharForm = useCallback(() => {
    setSelecionado(null);
    setError(null);
  }, []);

  const salvar = useCallback(async () => {
    if (!selecionado || !tratamentoId) return;
    if (!form.situacao) {
      setError("Informe o resultado da revisita.");
      return;
    }
    setSalvando(true);
    setError(null);

    let posicao: PosicaoAtual;
    try {
      posicao = await locationService.getCurrentPosition();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível obter sua localização.");
      setSalvando(false);
      return;
    }

    const marcarComoSalvo = () => {
      // F de novo → continua na lista; REC ou R → sai
      if (form.situacao !== "F") {
        setPendentes((prev) =>
          prev.filter((p) => p.imovel.id !== selecionado.imovel.id)
        );
      } else {
        setPendentes((prev) =>
          prev.map((p) =>
            p.imovel.id === selecionado.imovel.id
              ? { ...p, tentativas: p.tentativas + 1, ultima_tentativa: new Date().toISOString() }
              : p
          )
        );
      }
      setSelecionado(null);
    };

    try {
      const payload: RegistrarRecuperacaoPayload = {
        tratamento_id: tratamentoId,
        situacao: form.situacao as SituacaoImovel,
        horario_visita: new Date().toTimeString().slice(0, 5),
        focos_eliminados: parseInt(form.focos_eliminados) || 0,
        tratado: form.tratado,
        quantidade_larvicida: form.tratado
          ? parseFloat(form.quantidade_larvicida) || null
          : null,
        depositos_tratados: form.tratado
          ? parseInt(form.depositos_tratados) || null
          : null,
        latitude: posicao.latitude,
        longitude: posicao.longitude,
        mocked: posicao.mocked,
      };
      await recuperacaoService.registrar(selecionado.imovel.id, payload);

      marcarComoSalvo();
      setSuccessMsg(
        form.situacao === "REC"
          ? `Imóvel recuperado: ${selecionado.imovel.endereco_completo}`
          : form.situacao === "F"
          ? "Nova tentativa registrada — imóvel continua fechado."
          : `Recusa registrada: ${selecionado.imovel.endereco_completo}`
      );
    } catch (err: any) {
      if (isErroDeRede(err)) {
        outbox.enqueue("registrar_recuperacao", {
          imovel_id: selecionado.imovel.id,
          payload: {
            tratamento_id: tratamentoId,
            situacao: form.situacao,
            horario_visita: new Date().toTimeString().slice(0, 5),
            focos_eliminados: parseInt(form.focos_eliminados) || 0,
            tratado: form.tratado,
            quantidade_larvicida: form.tratado
              ? parseFloat(form.quantidade_larvicida) || null
              : null,
            depositos_tratados: form.tratado
              ? parseInt(form.depositos_tratados) || null
              : null,
            latitude: posicao.latitude,
            longitude: posicao.longitude,
            mocked: posicao.mocked,
          },
        } satisfies RegistrarRecuperacaoOffline);
        setPendentesSync(totalPendentes());

        marcarComoSalvo();
        setSuccessMsg("Sem conexão — revisita salva no aparelho. Será sincronizada.");
      } else {
        setError(
          err?.response?.data?.message ?? "Não foi possível registrar a revisita."
        );
      }
    } finally {
      setSalvando(false);
    }
  }, [selecionado, tratamentoId, form]);

  return {
    pendentes,
    selecionado,
    form,
    loading,
    salvando,
    error,
    successMsg,
    pendentesSync,
    carregar,
    abrirForm,
    fecharForm,
    salvar,
    setForm,
  };
}
