/**
 * Garante que, mesmo se várias requisições tomarem 401 ao mesmo tempo, só
 * uma chamada de refresh seja disparada — as demais aguardam essa mesma
 * promise em vez de disparar a delas (o backend rotaciona o refresh token
 * a cada uso, então refreshes concorrentes derrubariam uns aos outros).
 */
let refreshPromise: Promise<void> | null = null;

export function dedupeRefresh(refreshFn: () => Promise<void>): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = refreshFn().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/** Exposto só para os testes resetarem o estado do módulo entre casos. */
export function __resetRefreshStateForTests(): void {
  refreshPromise = null;
}
