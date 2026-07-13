import { useState, useCallback } from "react";
import { recuperacaoService } from "../services/recuperacaoService";
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
      };
      await recuperacaoService.registrar(selecionado.imovel.id, payload);

      // F de novo → continua na lista; REC ou R → sai
      if (form.situacao !== "F") {
        setPendentes((prev) =>
          prev.filter((p) => p.imovel.id !== selecionado.imovel.id)
        );
        setSuccessMsg(
          form.situacao === "REC"
            ? `Imóvel recuperado: ${selecionado.imovel.endereco_completo}`
            : `Recusa registrada: ${selecionado.imovel.endereco_completo}`
        );
      } else {
        setPendentes((prev) =>
          prev.map((p) =>
            p.imovel.id === selecionado.imovel.id
              ? { ...p, tentativas: p.tentativas + 1, ultima_tentativa: new Date().toISOString() }
              : p
          )
        );
        setSuccessMsg("Nova tentativa registrada — imóvel continua fechado.");
      }
      setSelecionado(null);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Não foi possível registrar a revisita."
      );
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
    carregar,
    abrirForm,
    fecharForm,
    salvar,
    setForm,
  };
}
