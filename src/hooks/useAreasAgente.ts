import { useState, useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "@/src/store/authStore";
import { api } from "@/src/services/api";
import * as Notifications from "expo-notifications";
import type { Area } from "@/src/types/area";

const POLLING_INTERVAL = 30_000;

function unwrapList<T>(res: any): T[] {
  return res.data?.data ?? res.data ?? [];
}

async function notificarNovaArea(nomeArea: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Nova área atribuída",
      body:  `A área "${nomeArea}" foi atribuída a você.`,
      sound: true,
    },
    trigger: null,
  });
}

export function useAreasAgente() {
  const { user } = useAuthStore();
  const [areas,   setAreas]   = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const idsConhecidos = useRef<Set<number>>(new Set());
  const primeiraVez   = useRef(true);
  const montado       = useRef(true); // evita setState após unmount

  const buscarAreas = useCallback(async (silencioso = false) => {
    if (!user?.id) return;
    if (!silencioso && montado.current) setLoading(true);

    try {
      const res   = await api.get("/areas");
      const todas = unwrapList<Area>(res);

      const minhas = todas.filter((area) =>
        area.ativo &&
        area.agentes?.some((ag) => ag.user_id === user.id)
      );

      // Detecta e notifica áreas novas
      if (!primeiraVez.current) {
        const novas = minhas.filter((a) => !idsConhecidos.current.has(a.id));
        for (const area of novas) {
          await notificarNovaArea(area.nome);
        }
      }

      idsConhecidos.current = new Set(minhas.map((a) => a.id));
      primeiraVez.current   = false;

      // ← atualiza o estado sempre, silencioso ou não
      if (montado.current) {
        setAreas(minhas);
        setError(null);
      }
    } catch {
      if (!silencioso && montado.current) {
        setError("Não foi possível carregar as áreas.");
      }
    } finally {
      if (!silencioso && montado.current) setLoading(false);
    }
  }, [user?.id]);

  // Primeira carga
  const fetch = useCallback(() => buscarAreas(false), [buscarAreas]);

  // Polling — roda independente, atualiza o mesmo estado
  useEffect(() => {
    montado.current = true;

    Notifications.requestPermissionsAsync();

    const intervalo = setInterval(() => {
      buscarAreas(true);
    }, POLLING_INTERVAL);

    return () => {
      montado.current = false;
      clearInterval(intervalo);
    };
  }, [buscarAreas]);

  return { areas, loading, error, fetch };
}