import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/src/services/api";

interface User {
  id: number;
  name: string;
  email: string;
  agente_id?: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  loading: boolean;
  error: string | null;

  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
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

          const token = data.access_token ?? data.token;
          const user = data.user ?? data.data;

          // Injeta token no header global
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          set({ token, user, loading: false });
          return true;
        } catch (err: any) {
          const msg =
            err?.response?.data?.message ??
            "E-mail ou senha incorretos.";
          set({ error: msg, loading: false });
          return false;
        }
      },

      logout: () => {
        api.defaults.headers.common["Authorization"] = "";
        set({ token: null, user: null, error: null });
      },

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "vigiageo-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ token: s.token, user: s.user }),

      onRehydrateStorage: () => (state: AuthState | undefined) => {
        console.log("rehydrated:", state?.token);
        if (state?.token) {
          api.defaults.headers.common["Authorization"] = `Bearer ${state.token}`;
        }
        state?.setHydrated();
      },
    }
  )
);