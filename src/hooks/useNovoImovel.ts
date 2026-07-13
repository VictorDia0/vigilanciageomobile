import { useState, useCallback } from "react";
import { imovelService, type CriarImovelPayload } from "@/src/services/imovelService";
import type { Imovel } from "@/src/types/imovel";

export type TipoImovel =
  | "residencia"        // era "residencial"
  | "comercio"          // era "comercial"
  | "terreno_baldio"
  | "ponto_estrategico"
  | "outro";            // era "outros"

export interface NovoImovelForm {
  logradouro: string;
  numero: string;
  sem_numero: boolean;
  tipo_imovel: TipoImovel | "";
}

export const NOVO_IMOVEL_FORM_INICIAL: NovoImovelForm = {
  logradouro: "",
  numero: "",
  sem_numero: false,
  tipo_imovel: ""
};

export function useNovoImovel(quadraId: number, onSucesso: (imovel: Imovel) => void) {
  const [form, setForm] = useState<NovoImovelForm>(NOVO_IMOVEL_FORM_INICIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validar = (): string | null => {
    if (!form.logradouro.trim()) return "Informe o logradouro.";
    if (!form.sem_numero && !form.numero.trim()) return "Informe o número ou marque 'Sem número'.";
    if (!form.tipo_imovel) return "Selecione o tipo do imóvel.";
    return null;
  };

  const salvar = useCallback(async () => {
    const erroValidacao = validar();
    if (erroValidacao) { setError(erroValidacao); return; }

    setLoading(true);
    setError(null);

    try {
      const payload: CriarImovelPayload = {
        quadra_id: quadraId,
        logradouro: form.logradouro.trim(),
        numero: form.sem_numero ? null : form.numero.trim() || null,
        sem_numero: form.sem_numero,
        tipo_imovel: form.tipo_imovel as string
      };

      const imovel = await imovelService.criar(payload);
      setForm(NOVO_IMOVEL_FORM_INICIAL);
      onSucesso(imovel);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Não foi possível cadastrar o imóvel.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [form, quadraId]);

  return { form, setForm, loading, error, salvar };
}