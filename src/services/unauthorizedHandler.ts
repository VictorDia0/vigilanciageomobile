import type { AxiosError, AxiosRequestConfig } from "axios";
import { dedupeRefresh } from "./refreshQueue";

const AUTH_ROUTES_WITHOUT_REFRESH = ["/auth/login", "/auth/refresh", "/auth/logout"];

function isAuthRouteWithoutRefresh(url: string | undefined): boolean {
  return (
    !!url && AUTH_ROUTES_WITHOUT_REFRESH.some((route) => url.includes(route))
  );
}

/**
 * Handler de 401 extraído em função pura pra ser testável sem servidor de
 * verdade: recebe refresh/retry/logout como dependências em vez de acessar
 * `api`/`authStore` diretamente.
 */
export async function handleUnauthorized(
  error: AxiosError,
  deps: {
    refresh: () => Promise<void>;
    retry: (config: AxiosRequestConfig) => Promise<unknown>;
    logout: () => Promise<void>;
  }
): Promise<unknown> {
  const config = error.config as AxiosRequestConfig | undefined;
  const is401 = error.response?.status === 401;

  if (!is401 || !config || isAuthRouteWithoutRefresh(config.url)) {
    return Promise.reject(error);
  }

  try {
    await dedupeRefresh(deps.refresh);
    return await deps.retry(config);
  } catch {
    await deps.logout();
    return Promise.reject(error);
  }
}
