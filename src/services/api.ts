import axios from "axios";

const BASE_URL = 'http://192.168.15.12:8000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      import("@/src/store/authStore").then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      });
    }
    return Promise.reject(error);
  }
);