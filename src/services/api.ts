import axios from "axios";

const BASE_URL = 'http://192.168.15.24:8000/api';

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

// Trata 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogoutRoute = error.config?.url?.includes('/auth/logout');
    const is401 = error.response?.status === 401;

    if (is401 && !isLogoutRoute) {
      import("@/src/store/authStore").then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      });
    }

    return Promise.reject(error);
  }
);