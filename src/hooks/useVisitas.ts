import { useState, useCallback, useMemo } from "react";
import { Alert, Platform } from "react-native";
import Constants from "expo-constants";
import type {
  ModoInicio,
  QuadraResumo,
  SituacaoImovel,
  Visita,
} from "@/src/types/visita";

import type { Area } from "@/src/types/area";
import type { Imovel } from "@/src/types/imovel";
import { visitaService } from "../services/visitaService";
import { api } from "../services/api";
import { outbox, type FecharVisitaOffline, type EncerrarQuadraOffline } from "../db/outbox";
import { sincronizarPendentes } from "../services/sync";
import {
  locationService,
  type LocalizacaoResultado,
} from "../services/locationService";
import { distanciaHaversine } from "../utils/geo";
import { useAuthStore } from "../store/authStore";
import { useSyncStore } from "../store/syncStore";

const DISTANCIA_FLAG_METROS = 50;

// ─── Steps do fluxo ───────────────────────────────────────────────────────────
//
// selecionar_area → selecionar_quadra → confirmar_inicio → visita_aberta ⇄ form_imovel
//
// Saídas de visita_aberta:
//   encerrarDia()     → fecha a SESSÃO, quadra continua em_andamento → selecionar_quadra
//   encerrarQuadra()  → fecha sessão + quadra concluida (DEFINITIVO) → selecionar_quadra

export type VisitaStep =
  | "selecionar_area"
  | "selecionar_quadra"
  | "confirmar_inicio"
  | "visita_aberta"
  | "form_imovel";

// ─── Estado do formulário de imóvel ──────────────────────────────────────────

export interface ImovelFormState {
  // Dados do imóvel
  logradouro: string;
  numero: string;
  sem_numero: boolean;
  tipo_imovel: string;
  // Dados da visita
  situacao: SituacaoImovel | "";
  focos_eliminados: string;
  tratado: boolean;
  quantidade_larvicida: string;
  depositos_tratados: string;
  /** URIs locais (expo-image-picker) — enviadas via visitaService.uploadFoto ao salvar */
  fotos: string[];
}

/** Alerta (não bloqueia) quando o GPS foge do raio de 30km cadastrado da cidade. */
function confirmarForaDoRaio(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      "Fora do raio da cidade",
      "Você está fora do raio de 30km cadastrado para esta cidade. Isso pode ser um endereço de cidade cadastrado errado. Confirma o registro mesmo assim?",
      [
        { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
        { text: "Confirmar mesmo assim", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

const FORM_VAZIO: ImovelFormState = {
  logradouro: "",
  numero: "",
  sem_numero: false,
  tipo_imovel: "residencia",
  situacao: "",
  focos_eliminados: "0",
  tratado: false,
  quantidade_larvicida: "",
  depositos_tratados: "",
  fotos: [],
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVisitas() {
  const [step, setStep] = useState<VisitaStep>("selecionar_area");

  const [areas, setAreas] = useState<Area[]>([]);
  const [areaSelecionada, setAreaSelecionada] = useState<Area | null>(null);
  const [quadraSelecionada, setQuadraSelecionada] =
    useState<QuadraResumo | null>(null);
  const [visitaAberta, setVisitaAberta] = useState<Visita | null>(null);
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [form, setForm] = useState<ImovelFormState>(FORM_VAZIO);

  // ── Anti-fraude: GPS/tempo capturados por registro de imóvel ───────────────
  const [iniciadaEm, setIniciadaEm] = useState<string | null>(null);
  const [posicaoInicio, setPosicaoInicio] = useState<LocalizacaoResultado | null>(null);
  const [avisoGps, setAvisoGps] = useState<string | null>(null);

  /** Como a quadra será aberta: iniciar | continuar | retomar */
  const [modoInicio, setModoInicio] = useState<ModoInicio>("iniciar");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const pendentesSync = useSyncStore((s) => s.pendentes);
  const refreshPendentesSync = useSyncStore((s) => s.refresh);

  // Imóveis fechados (F) da quadra atual — vão para a recuperação
  const totalFechados = useMemo(
    () =>
      imoveis.filter((i) => i.visita_dados?.situacao?.value === "F").length,
    [imoveis]
  );

  // ─── Selecionar área ───────────────────────────────────────────────────────

  const selecionarArea = useCallback((area: Area) => {
    setAreaSelecionada(area);
    setQuadraSelecionada(null);
    setError(null);
    setStep("selecionar_quadra");
  }, []);

  // ─── Selecionar quadra ─────────────────────────────────────────────────────
  //
  // Decide o modo de abertura:
  //   concluida     → bloqueia (a tela oferece a Recuperação)
  //   sessão aberta → "continuar"
  //   em_andamento  → "retomar" (nova sessão do dia)
  //   nao_iniciada  → "iniciar"

  const selecionarQuadra = useCallback(
    async (quadra: QuadraResumo, tratamentoId: number) => {
      if (quadra.status === "concluida") {
        setError("Este quarteirão já foi encerrado e não pode ser reaberto.");
        return;
      }
      setQuadraSelecionada(quadra);
      setLoading(true);
      setError(null);
      try {
        const [sessaoAberta, imoveisDaQuadra] = await Promise.all([
          visitaService.buscarVisitaAberta(quadra.id, tratamentoId),
          visitaService.listarImoveisDaQuadra(quadra.id),
        ]);

        setImoveis(imoveisDaQuadra);

        if (sessaoAberta) {
          setVisitaAberta(sessaoAberta);
          setModoInicio("continuar");
        } else {
          setVisitaAberta(null);
          setModoInicio(
            quadra.status === "em_andamento" ? "retomar" : "iniciar"
          );
        }
        setStep("confirmar_inicio");
      } catch {
        setError("Não foi possível carregar os dados do quarteirão.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ─── Iniciar / retomar visitas do dia ──────────────────────────────────────

  const iniciarVisita = useCallback(
    async (tratamentoId: number) => {
      if (!quadraSelecionada) return;

      // Sessão já aberta → só entra
      if (modoInicio === "continuar" && visitaAberta) {
        setStep("visita_aberta");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const visita = await visitaService.abrirVisita({
          quadra_id: quadraSelecionada.id,
          tratamento_id: tratamentoId,
        });
        setVisitaAberta(visita);
        // "retomar": mantém imóveis já registrados; "iniciar": lista veio vazia
        setSuccessMsg(null);
        setStep("visita_aberta");
        // Atualiza a área p/ refletir quadra em_andamento
        atualizarArea();
      } catch (err: any) {
        setError(
          err?.response?.data?.message ?? "Não foi possível iniciar a visita."
        );
      } finally {
        setLoading(false);
      }
    },
    [quadraSelecionada, modoInicio, visitaAberta]
  );

  const atualizarArea = useCallback(async () => {
    if (!areaSelecionada) return;
    try {
      const res = await api.get(`/areas/${areaSelecionada.id}`);
      const dados = res.data?.data ?? res.data;
      if (dados) setAreaSelecionada(dados);
    } catch {
      /* silencioso — não bloqueia o fluxo */
    }
  }, [areaSelecionada]);

  // ─── Abrir formulário de novo imóvel ───────────────────────────────────────

  const novoImovel = useCallback(() => {
    setForm(FORM_VAZIO);
    setError(null);
    setSuccessMsg(null);
    setAvisoGps(null);
    setStep("form_imovel");

    // Captura o GPS de início em segundo plano assim que o formulário abre —
    // não trava a navegação, o resultado só é usado no submit (salvarImovel).
    setIniciadaEm(new Date().toISOString());
    setPosicaoInicio(null);
    locationService.getCurrentLocationWithMetadata().then(setPosicaoInicio);
  }, []);

  // ─── Reflete o resultado da sincronização de um imóvel local na lista ─────
  // Chamado depois que sincronizarPendentes() roda: se o item já não está
  // mais na outbox, sincronizou com sucesso; se está com tentativas > 0,
  // o servidor recusou (erro de negócio) e o motivo fica visível no card.
  const atualizarStatusSync = useCallback((clientUuid: string) => {
    setImoveis((prev) =>
      prev.map((im) => {
        if (im.client_uuid !== clientUuid) return im;
        const item = outbox.buscarPorUuid(clientUuid);
        if (!item) return { ...im, pendente_sync: false, sync_erro: null };
        if (item.tentativas > 0) return { ...im, sync_erro: item.ultimo_erro };
        return im;
      })
    );
  }, []);

  // ─── Salvar imóvel (sempre vai pra fila, sincroniza em segundo plano) ─────

  const salvarImovel = useCallback(async () => {
    if (!visitaAberta || !quadraSelecionada) return;

    if (!form.logradouro.trim()) {
      setError("Informe o logradouro.");
      return;
    }
    if (!form.tipo_imovel) {
      setError("Selecione o tipo do imóvel.");
      return;
    }
    if (!form.situacao) {
      setError("Selecione a situação da visita.");
      return;
    }
    if (!form.sem_numero && !form.numero.trim()) {
      setError("Informe o número ou marque 'Sem número'.");
      return;
    }

    setLoading(true);
    setError(null);
    setAvisoGps(null);

    // GPS é capturado no início (novoImovel) e agora no fim — mas nunca
    // bloqueia o salvamento. Se faltar, segue com gps_disponivel=false e
    // as flags ficam pra análise do supervisor depois. O raio de 30km da
    // cidade continua como alerta client-side (coordenadas da cidade podem
    // ser imprecisas), só roda quando há GPS de fato.
    //
    // GPS continua síncrono de propósito — é o dado anti-fraude que precisa
    // ser capturado nesse instante exato, não minutos depois numa
    // sincronização em segundo plano. Foto e as chamadas de rede (criar +
    // registrar imóvel), essas sim, vão pra fila logo abaixo.
    const finalizadaEm = new Date().toISOString();
    const posicaoFim = await locationService.getCurrentLocationWithMetadata();

    if (posicaoFim.disponivel) {
      const cidade = useAuthStore.getState().user?.cidade;
      if (cidade?.lat != null && cidade?.lng != null) {
        const dentroDoRaio = locationService.isWithinRadius(
          { latitude: posicaoFim.latitude, longitude: posicaoFim.longitude },
          { latitude: cidade.lat, longitude: cidade.lng }
        );
        if (!dentroDoRaio) {
          const confirma = await confirmarForaDoRaio();
          if (!confirma) {
            setError("Registro cancelado — fora do raio da cidade.");
            setLoading(false);
            return;
          }
        }
      }
    } else {
      setAvisoGps("Localização indisponível — a visita será registrada sem GPS.");
    }

    const distanciaMetros =
      posicaoInicio?.disponivel && posicaoFim.disponivel
        ? distanciaHaversine(
            posicaoInicio.latitude,
            posicaoInicio.longitude,
            posicaoFim.latitude,
            posicaoFim.longitude
          )
        : null;
    const gpsMocked = Boolean(
      (posicaoInicio?.disponivel && posicaoInicio.mocked) ||
        (posicaoFim.disponivel && posicaoFim.mocked)
    );
    const tempoVisitaSegundos = iniciadaEm
      ? Math.round((new Date(finalizadaEm).getTime() - new Date(iniciadaEm).getTime()) / 1000)
      : 0;

    const horario = new Date().toTimeString().slice(0, 5);
    const dadosImovel = {
      logradouro: form.logradouro.trim(),
      numero: form.sem_numero ? null : form.numero.trim(),
      sem_numero: form.sem_numero,
      tipo_imovel: form.tipo_imovel,
    };

    const dadosRegistro = {
      horario_visita: horario,
      situacao: form.situacao as SituacaoImovel,
      focos_eliminados: parseInt(form.focos_eliminados) || 0,
      tratado: form.tratado,
      quantidade_larvicida: form.tratado
        ? parseFloat(form.quantidade_larvicida) || null
        : null,
      depositos_tratados: form.tratado
        ? parseInt(form.depositos_tratados) || null
        : null,
      latitude: posicaoFim.disponivel ? posicaoFim.latitude : undefined,
      longitude: posicaoFim.disponivel ? posicaoFim.longitude : undefined,
      mocked: posicaoFim.disponivel ? posicaoFim.mocked : undefined,
      lat_inicio: posicaoInicio?.disponivel ? posicaoInicio.latitude : null,
      lng_inicio: posicaoInicio?.disponivel ? posicaoInicio.longitude : null,
      precisao_gps_inicio: posicaoInicio?.disponivel ? posicaoInicio.accuracy : null,
      lat_fim: posicaoFim.disponivel ? posicaoFim.latitude : null,
      lng_fim: posicaoFim.disponivel ? posicaoFim.longitude : null,
      precisao_gps_fim: posicaoFim.disponivel ? posicaoFim.accuracy : null,
      distancia_metros: distanciaMetros,
      distancia_flag: distanciaMetros !== null && distanciaMetros > DISTANCIA_FLAG_METROS,
      iniciada_em: iniciadaEm ?? finalizadaEm,
      finalizada_em: finalizadaEm,
      tempo_visita_segundos: tempoVisitaSegundos,
      gps_mocked: gpsMocked,
      gps_disponivel: posicaoFim.disponivel,
      plataforma: (Platform.OS === "ios" ? "ios" : "android") as "ios" | "android",
      versao_app: Constants.expoConfig?.version ?? "desconhecida",
    };

    // ─── Sempre vai pra fila — o imóvel aparece na lista na hora, e a foto +
    // as chamadas de rede (criar/registrar) sincronizam em segundo plano.
    // Isso é o que de fato demorava: rede de campo é lenta e instável, não
    // faz sentido travar o agente na tela esperando dois round-trips.
    let clientUuid: string;
    try {
      clientUuid = outbox.enqueue("registrar_imovel", {
        visita_id: visitaAberta.id,
        quadra_id: quadraSelecionada.id,
        imovel: dadosImovel,
        fotosLocais: form.fotos,
        registro: dadosRegistro,
      });
    } catch {
      setError("Não foi possível salvar o imóvel no aparelho.");
      setLoading(false);
      return;
    }

    const enderecoCompleto = `${dadosImovel.logradouro}${dadosImovel.numero ? ", " + dadosImovel.numero : ""}`;
    setImoveis((prev) => [
      ...prev,
      {
        id: -Date.now(), // id temporário local — substituído quando a sincronização confirma
        ...dadosImovel,
        endereco_completo: enderecoCompleto,
        tipo_imovel: { value: form.tipo_imovel, label: form.tipo_imovel },
        ativo: true,
        created_at: null,
        pendente_sync: true,
        client_uuid: clientUuid,
        visita_dados: {
          horario_visita: horario,
          situacao: { value: form.situacao, label: "" },
          focos_eliminados: dadosRegistro.focos_eliminados,
          tratado: form.tratado,
          quantidade_larvicida: dadosRegistro.quantidade_larvicida,
          depositos_tratados: dadosRegistro.depositos_tratados,
        },
      } as Imovel,
    ]);
    setSuccessMsg(`Imóvel registrado: ${enderecoCompleto}`);
    setStep("visita_aberta");
    setLoading(false);
    refreshPendentesSync();

    // Dispara a sincronização sem travar a navegação — se já tiver uma em
    // andamento (ex.: outro imóvel salvo segundos atrás), reaproveita.
    sincronizarPendentes().finally(() => {
      refreshPendentesSync();
      atualizarStatusSync(clientUuid);
    });
  }, [visitaAberta, quadraSelecionada, form, iniciadaEm, posicaoInicio, atualizarStatusSync]);

  // ─── Encerrar visitas do DIA (pausa/fim de expediente) ─────────────────────
  // A quadra CONTINUA em_andamento. Amanhã o agente retoma de onde parou.

  const encerrarDia = useCallback(() => {
    if (!visitaAberta) return;

    // Sempre enfileira e sai da tela na hora — igual ao registro de
    // imóvel. Se o servidor recusar por algum motivo, isso aparece
    // depois em Perfil > Registros com erro, não trava o agente aqui.
    outbox.enqueue("fechar_visita", { visita_id: visitaAberta.id } satisfies FecharVisitaOffline);
    refreshPendentesSync();
    setVisitaAberta(null);
    setImoveis([]);
    setQuadraSelecionada(null);
    setSuccessMsg(
      "Visitas do dia encerradas. O quarteirão continua em andamento — retome quando voltar."
    );
    setStep("selecionar_quadra");
    atualizarArea();

    sincronizarPendentes().finally(refreshPendentesSync);
  }, [visitaAberta, atualizarArea]);

  // ─── Encerrar QUARTEIRÃO (definitivo) ──────────────────────────────────────
  // Fecha a sessão aberta e marca a quadra como concluída. Não reabre.
  // Imóveis F continuam acessíveis na tela de Recuperação.

  const encerrarQuadra = useCallback(() => {
    if (!quadraSelecionada) return;

    // Mesma lógica do registro de imóvel: enfileira e sai da tela na
    // hora. Erro de servidor vira item em Perfil > Registros com erro
    // em vez de travar o agente aqui.
    outbox.enqueue("encerrar_quadra", {
      visita_id: visitaAberta?.id ?? null,
      quadra_id: quadraSelecionada.id,
    } satisfies EncerrarQuadraOffline);
    refreshPendentesSync();
    setVisitaAberta(null);
    setImoveis([]);
    setQuadraSelecionada(null);
    setSuccessMsg("Quarteirão encerrado. Selecione o próximo para continuar o dia.");
    setStep("selecionar_quadra");
    atualizarArea();

    sincronizarPendentes().finally(refreshPendentesSync);
  }, [quadraSelecionada, visitaAberta, atualizarArea]);

  // ─── Sincronizar registros offline ─────────────────────────────────────────

  const sincronizar = useCallback(async () => {
    const r = await sincronizarPendentes();
    refreshPendentesSync();
    if (r.enviados > 0) {
      setSuccessMsg(`${r.enviados} registro(s) sincronizado(s).`);
    }
    return r;
  }, []);

  // ─── Voltar step ───────────────────────────────────────────────────────────

  const voltar = useCallback(() => {
    setError(null);
    const mapa: Partial<Record<VisitaStep, VisitaStep>> = {
      selecionar_quadra: "selecionar_area",
      confirmar_inicio: "selecionar_quadra",
      visita_aberta: "selecionar_quadra",
      form_imovel: "visita_aberta",
    };
    const destino = mapa[step];
    if (destino) setStep(destino);
  }, [step]);

  return {
    // state
    step,
    areas,
    areaSelecionada,
    quadraSelecionada,
    visitaAberta,
    imoveis,
    form,
    loading,
    error,
    successMsg,
    modoInicio,
    totalFechados,
    pendentesSync,
    avisoGps,

    // actions
    setAreas,
    setForm,
    setError,
    selecionarArea,
    selecionarQuadra,
    iniciarVisita,
    novoImovel,
    salvarImovel,
    encerrarDia,
    encerrarQuadra,
    sincronizar,
    voltar,
    setStep,
  };
}
