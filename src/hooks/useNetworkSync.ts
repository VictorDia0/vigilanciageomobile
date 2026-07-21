import { useEffect, useRef, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { sincronizarPendentes, totalPendentes } from "@/src/services/sync";

/**
 * Observa conectividade e dispara sincronização automática da outbox ao
 * reconectar (transição offline → online). Também expõe o status atual
 * para exibir um indicador na UI.
 */
export function useNetworkSync() {
  const [online, setOnline] = useState(true);
  const [pendentes, setPendentes] = useState(0);
  const estavaOffline = useRef(false);

  useEffect(() => {
    setPendentes(totalPendentes());

    const unsubscribe = NetInfo.addEventListener((state) => {
      const conectado = !!state.isConnected;
      setOnline(conectado);

      if (conectado && estavaOffline.current) {
        sincronizarPendentes().finally(() => setPendentes(totalPendentes()));
      }
      estavaOffline.current = !conectado;
    });

    return () => unsubscribe();
  }, []);

  return { online, pendentes };
}
