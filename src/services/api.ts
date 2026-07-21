import axios from "axios";
import type { AxiosError } from "axios";
import { resolveBaseUrl } from "./env";
import { secureStorage } from "./secureStorage";
import { handleUnauthorized } from "./unauthorizedHandler";

const BASE_URL = resolveBaseUrl(process.env);

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Injeta token em toda requisição
api.interceptors.request.use(async (config) => {
  const { useAuthStore } = await import("@/src/store/authStore");
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function refreshToken(): Promise<void> {
  const { data } = await api.post("/auth/refresh");
  const token = data?.data?.access_token ?? data?.access_token;
  if (!token) {
    throw new Error("Refresh não retornou access_token.");
  }
  await secureStorage.setToken(token);
  const { useAuthStore } = await import("@/src/store/authStore");
  useAuthStore.getState().setToken(token);
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) =>
    handleUnauthorized(error, {
      refresh: refreshToken,
      retry: (config) => api.request(config),
      logout: () =>
        import("@/src/store/authStore").then(({ useAuthStore }) =>
          useAuthStore.getState().logout()
        ),
    })
);
