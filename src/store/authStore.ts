import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/src/services/api";
import { secureStorage } from "@/src/services/secureStorage";

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
    lat?: number;
    lng?: number;
  };
  agente?: {
    id: number;
    matricula: string;
    telefone: string | null;
    status: string;
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
  logout: () => Promise<void>;
  setToken: (token: string | null) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
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

          if (token) {
            await secureStorage.setToken(token);
          }

          set({ token, user, authenticated: true, loading: false });
          return true;
        } catch (err: any) {
          const msg = err?.response?.data?.message ?? "E-mail ou senha incorretos.";
          set({ error: msg, loading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch {
          // segue o logout local mesmo se a chamada falhar (ex.: sem rede)
        }
        await secureStorage.deleteToken();
        set({ token: null, user: null, authenticated: false, error: null, loading: false });
      },

      setToken: (token) => set({ token }),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "vigiageo-auth",
      storage: createJSONStorage(() => AsyncStorage),
      // Só dado não sensível vai pro AsyncStorage — o token nunca é persistido
      // aqui, só em memória + SecureStore (ver onRehydrateStorage abaixo).
      partialize: (s) => ({ user: s.user, authenticated: s.authenticated }),
      onRehydrateStorage: () => (state) => {
        secureStorage.getToken().then((token) => {
          state?.setToken(token);
          state?.setHydrated();
        });
      },
    }
  )
);
