import { create } from "zustand";
import { totalPendentes } from "@/src/services/sync";
import { outbox } from "@/src/db/outbox";

interface SyncState {
  pendentes: number;
  /** Itens que já tentaram sincronizar e falharam por erro de negócio —
   * continuam "pendentes", mas não vão se resolver sozinhos tentando de novo. */
  comFalha: number;
  ultimoErro: string | null;
  refresh: () => void;
}

/** Fonte única de verdade do total de itens pendentes na outbox — evita
 * que banner global, Perfil e telas de visita/recuperação fiquem com
 * contagens divergentes entre si. */
export const useSyncStore = create<SyncState>((set) => ({
  pendentes: totalPendentes(),
  comFalha: outbox.comFalha(),
  ultimoErro: outbox.ultimoErro(),
  refresh: () =>
    set({
      pendentes: totalPendentes(),
      comFalha: outbox.comFalha(),
      ultimoErro: outbox.ultimoErro(),
    }),
}));
