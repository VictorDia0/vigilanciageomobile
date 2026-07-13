import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/src/services/api";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  cidade_id?: number;
  cidade?: {
    id: number;
    nome: string;
    uf: string;
  };
}

interface AuthState {
  token: string | null;
  user: User | null;
  authenticated: boolean;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,              // ← estava faltando
      user: null,
      authenticated: false,
      hydrated: false,
      loading: false,
      error: null,

      login: async (email, senha) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post("/auth/login", {
            email,
            password: senha,
          });

          const token = data.access_token ?? data.token ?? null;
          const user = data.data ?? data.user ?? data;

          const role = user?.role ?? user?.roles?.[0];
          if (role && role !== "agente") {
            set({ error: "Acesso restrito ao app de campo. Use o portal web.", loading: false });
            return false;
          }

          set({ token, user, authenticated: true, loading: false });
          return true;
        } catch (err: any) {
          const msg = err?.response?.data?.message ?? "E-mail ou senha incorretos.";
          set({ error: msg, loading: false });
          return false;
        }
      },

      logout: () => {
        api.post("/auth/logout").catch(() => {});
        delete api.defaults.headers.common["Authorization"];
        set({ token: null, user: null, authenticated: false, error: null, loading: false });
      },

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "vigiageo-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ token: s.token, user: s.user, authenticated: s.authenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);