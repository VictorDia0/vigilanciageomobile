import { useEffect, useRef, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { sincronizarPendentes } from "@/src/services/sync";
import { useSyncStore } from "@/src/store/syncStore";

/**
 * Observa conectividade e dispara sincronização automática da outbox ao
 * reconectar (transição offline → online). O contador de pendentes vem do
 * syncStore compartilhado — qualquer sincronização disparada por outra tela
 * (ex.: botão manual do Perfil) já reflete aqui automaticamente.
 */
export function useNetworkSync() {
  const [online, setOnline] = useState(true);
  const pendentes = useSyncStore((s) => s.pendentes);
  const comFalha = useSyncStore((s) => s.comFalha);
  const refresh = useSyncStore((s) => s.refresh);
  const estavaOffline = useRef(false);

  useEffect(() => {
    refresh();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const conectado = !!state.isConnected;
      setOnline(conectado);

      if (conectado && estavaOffline.current) {
        sincronizarPendentes().finally(refresh);
      }
      estavaOffline.current = !conectado;
    });

    return () => unsubscribe();
  }, [refresh]);

  return { online, pendentes, comFalha };
}
