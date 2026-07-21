# Pacote de Hardening de Segurança — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar os 6 achados de segurança do pacote de hardening (spec:
`docs/superpowers/specs/2026-07-14-mobile-security-hardening-design.md`) sem
tocar no backend (`vigilancia-geo-backend`).

**Architecture:** O backend já usa cookies httpOnly (`access_token`,
`refresh_token`) como fonte de verdade da sessão — o app hoje tenta (sem
sucesso, é código morto) usar um Bearer token que nunca existe no corpo da
resposta de login. Este plano remove esse código morto, adota o modelo de
cookies de propósito, adiciona renovação automática via `/auth/refresh`
(dedupe de chamadas concorrentes), logout por inatividade persistido (>=15min
em background, sobrevive a force-kill), guarda de rota no grupo `(app)`,
permissões de localização no `app.json` e URL de API via variável de
ambiente.

**Tech Stack:** Expo Router 6, React Native 0.81 (New Architecture), Zustand
(persist + AsyncStorage), axios, `@react-native-cookies/cookies` (novo),
Jest + Babel puro (sem `jest-expo`/RTL — ver Task 1).

## Global Constraints

- Nenhuma alteração no repositório `vigilancia-geo-backend`.
- `logout()` do `authStore` passa a ser `async` (retorna `Promise<void>`) —
  todo call site que só chamava `logout()` de forma síncrona continua
  funcionando (chamar sem `await` é válido em JS/TS), mas qualquer código
  novo que precise garantir que o logout terminou deve dar `await`.
- Sem lib de teste de componente (`@testing-library/react-native`,
  `jest-expo`, `react-test-renderer`) neste pacote — ver justificativa na
  Task 1. Toda lógica testável automaticamente foi extraída em funções puras
  com injeção de dependência; o que só existe como efeito colateral de
  React/AppState/AsyncStorage é coberto pelo protocolo de teste manual
  descrito em cada task e consolidado na spec.
- `EXPO_PUBLIC_API_URL` é obrigatória — o app falha alto e cedo (throw no
  carregamento do módulo) se estiver ausente, em vez de deixar `baseURL`
  cair silenciosamente em `undefined`.

---

## Task 1: Infraestrutura de testes (Jest + Babel puro)

Não usamos `jest-expo` neste pacote: todos os módulos que precisam de teste
automatizado neste plano são lógica pura (dedupe de refresh, cálculo de
timeout de inatividade, resolução de URL, decisão de guarda de rota) — nenhum
deles renderiza componente React nem chama API nativa diretamente. Puxar
`jest-expo`/`@testing-library/react-native`/`react-test-renderer` só pra
isso adicionaria uma superfície grande de configuração (mocks de
AsyncStorage, ambiente jsdom, compatibilidade com React 19 + New
Architecture) sem necessidade real neste pacote. Fica registrado como
trabalho futuro se/quando o projeto precisar testar componentes de verdade.

**Files:**
- Create: `babel.config.js`
- Create: `jest.setup.js`
- Modify: `package.json`
- Test: `src/utils/__tests__/smoke.test.ts`

**Interfaces:**
- Produces: comando `npm test` rodando Jest; `process.env.EXPO_PUBLIC_API_URL`
  pré-populado em todo teste via `jest.setup.js` (as tasks seguintes que
  importam `src/services/api.ts` dependem disso pra não quebrar no import).

- [ ] **Step 1: Escrever o teste de fumaça (vai falhar — Jest não está configurado)**

Criar `src/utils/__tests__/smoke.test.ts`:

```ts
describe("test infrastructure", () => {
  it("runs a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 2: Confirmar que falha**

Run: `npx jest`
Expected: erro (comando `jest` não encontrado / não configurado).

- [ ] **Step 3: Instalar as dependências de teste**

```bash
npm install --save-dev jest@^30.4.2 babel-jest@^30.4.1 @babel/core@^7.29.7 @babel/preset-env@^7.29.7 @babel/preset-typescript@^7.29.7 @types/jest@^30.0.0
```

- [ ] **Step 4: Criar `babel.config.js`**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["@babel/preset-env", "@babel/preset-typescript"],
  };
};
```

- [ ] **Step 5: Criar `jest.setup.js`**

```js
// Garante que módulos como src/services/api.ts (que lêem
// EXPO_PUBLIC_API_URL no carregamento do módulo e falham se ausente)
// possam ser importados em teste sem precisar de um .env real.
process.env.EXPO_PUBLIC_API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://test.local/api";
```

- [ ] **Step 6: Adicionar configuração do Jest e script de teste em `package.json`**

Adicionar ao objeto raiz de `package.json` (depois de `"scripts"`):

```json
  "jest": {
    "testEnvironment": "node",
    "setupFiles": ["<rootDir>/jest.setup.js"],
    "testPathIgnorePatterns": ["/node_modules/", "/.expo/"]
  },
```

E em `"scripts"`, adicionar:

```json
    "test": "jest",
```

- [ ] **Step 7: Rodar e confirmar que passa**

Run: `npm test`
Expected: `PASS src/utils/__tests__/smoke.test.ts` — 1 teste passando.

- [ ] **Step 8: Commit**

```bash
git add babel.config.js jest.setup.js package.json package-lock.json src/utils/__tests__/smoke.test.ts
git commit -m "test: configurar infraestrutura de testes com Jest"
```

---

## Task 2: URL da API via variável de ambiente

**Files:**
- Create: `src/services/env.ts`
- Test: `src/services/env.test.ts`
- Create: `.env`
- Create: `.env.example`
- Modify: `src/services/api.ts:1-3`

**Interfaces:**
- Produces: `resolveBaseUrl(env: Record<string, string | undefined>): string`
  (lança `Error` se `EXPO_PUBLIC_API_URL` ausente/vazia) — usado por
  `src/services/api.ts` e por qualquer task futura que precise da URL base.

- [ ] **Step 1: Escrever o teste (vai falhar — módulo não existe)**

Criar `src/services/env.test.ts`:

```ts
import { resolveBaseUrl } from "./env";

describe("resolveBaseUrl", () => {
  it("returns the URL when EXPO_PUBLIC_API_URL is set", () => {
    expect(
      resolveBaseUrl({ EXPO_PUBLIC_API_URL: "https://api.example.com" })
    ).toBe("https://api.example.com");
  });

  it("throws when EXPO_PUBLIC_API_URL is missing", () => {
    expect(() => resolveBaseUrl({})).toThrow("EXPO_PUBLIC_API_URL");
  });

  it("throws when EXPO_PUBLIC_API_URL is an empty string", () => {
    expect(() => resolveBaseUrl({ EXPO_PUBLIC_API_URL: "" })).toThrow(
      "EXPO_PUBLIC_API_URL"
    );
  });
});
```

- [ ] **Step 2: Confirmar que falha**

Run: `npm test -- env.test.ts`
Expected: FAIL — `Cannot find module './env'`.

- [ ] **Step 3: Implementar `src/services/env.ts`**

```ts
export function resolveBaseUrl(
  env: Record<string, string | undefined>
): string {
  const url = env.EXPO_PUBLIC_API_URL;
  if (!url) {
    throw new Error(
      "EXPO_PUBLIC_API_URL não está definida. Crie um arquivo .env na raiz do projeto (veja .env.example)."
    );
  }
  return url;
}
```

- [ ] **Step 4: Confirmar que passa**

Run: `npm test -- env.test.ts`
Expected: PASS — 3 testes passando.

- [ ] **Step 5: Criar `.env`**

```
EXPO_PUBLIC_API_URL=http://192.168.15.24:8000/api
```

- [ ] **Step 6: Criar `.env.example`**

```
# URL base da API Laravel. Em dev, aponte para o IP da máquina rodando o
# backend na mesma rede local do dispositivo/emulador. Em produção, use a
# URL HTTPS via variável de ambiente do build profile do EAS.
EXPO_PUBLIC_API_URL=http://192.168.15.24:8000/api
```

- [ ] **Step 7: Ligar em `src/services/api.ts`**

Substituir as linhas 1-3 (`import axios from "axios";` até
`const BASE_URL = 'http://192.168.15.24:8000/api';`) por:

```ts
import axios from "axios";
import { resolveBaseUrl } from "./env";

const BASE_URL = resolveBaseUrl(process.env);
```

- [ ] **Step 8: Rodar toda a suíte e confirmar que nada quebrou**

Run: `npm test`
Expected: todos os testes (smoke + env) PASS.

- [ ] **Step 9: Commit**

```bash
git add src/services/env.ts src/services/env.test.ts src/services/api.ts .env .env.example
git commit -m "feat: extrair URL da API para variável de ambiente"
```

---

## Task 3: Modelo de autenticação — cookies httpOnly de propósito

**Files:**
- Modify: `src/store/authStore.ts` (reescrita completa)
- Modify: `src/services/api.ts` (remover interceptor de request Bearer, adicionar `withCredentials`)
- Modify: `app.json` (remover plugin `expo-secure-store`, não usado)
- Modify: `package.json` (remover dependência `expo-secure-store`; adicionar `@react-native-cookies/cookies`)

**Interfaces:**
- Consumes: nenhuma das tasks anteriores além de `env.ts` (já ligado).
- Produces: `useAuthStore` sem o campo `token`; `logout(): Promise<void>`
  (era síncrono antes). Tasks 6 e 7 chamam `useAuthStore.getState().logout()`
  e devem tratá-lo como assíncrono.

### Por que este é o achado CRÍTICO #1 original, revisado

A auditoria original assumia que o app guardava um JWT Bearer real em
AsyncStorage. Investigação no backend (`AuthController::login`,
`InjectAccessTokenFromCookie`, `AutenticatedUserResource::toArrayWithToken`
— nunca chamado) confirmou que o corpo da resposta de login **não** inclui
`access_token`; a sessão vive inteiramente em cookies httpOnly. Ou seja,
`data.access_token ?? data.token ?? null` em `authStore.ts` sempre resolvia
pra `null`, e o header `Authorization` que o app achava que enviava nunca
saía. Ver `docs/superpowers/specs/2026-07-14-mobile-security-hardening-design.md`
pro raciocínio completo.

- [ ] **Step 1 — GATE MANUAL, não pular: confirmar que o cookie jar do RN está de fato funcionando**

Esse pacote inteiro assume que o React Native persiste e reenvia cookies
automaticamente por origem (como um browser) e que o backend
(`InjectAccessTokenFromCookie`) converte isso em autenticação. Antes de
remover qualquer código, confirme isso empiricamente:

1. Rode o app apontando pro backend local (`npx expo start`, abrir no
   device/emulador com o dev client já buildado).
2. Em `src/store/authStore.ts`, dentro de `login()`, logo após
   `const { data } = await api.post("/auth/login", {...});`, adicionar
   temporariamente:
   ```ts
   console.log("[DEBUG][auth] corpo da resposta de login:", JSON.stringify(data));
   ```
3. Fazer login de verdade no app.
4. No log do Metro, confirmar que **não** existe `access_token` no corpo
   (confirma a descoberta acima).
5. Sem fechar o app, navegar pra uma tela que dependa de dado autenticado
   (ex.: Dashboard, que chama `GET` em rota protegida). Se carregar
   normalmente — mesmo sem qualquer token salvo no `authStore` — o cookie
   jar está funcionando como esperado. **Se a tela falhar com 401/erro de
   autenticação aqui, PARE.** A premissa deste pacote não se sustenta neste
   ambiente (ex.: cookie jar desabilitado, adapter de rede diferente) e
   isso precisa ser escalado antes de continuar — não prossiga removendo o
   fallback Bearer sem essa confirmação.
6. Remover o `console.log` temporário (não commitar).

- [ ] **Step 2: Reescrever `src/store/authStore.ts`**

```ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CookieManager from "@react-native-cookies/cookies";
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
  user: User | null;
  authenticated: boolean;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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

          const user = data.data ?? data.user ?? data;

          const role = user?.role ?? user?.roles?.[0];
          if (role && role !== "agente") {
            set({
              error: "Acesso restrito ao app de campo. Use o portal web.",
              loading: false,
            });
            return false;
          }

          set({ user, authenticated: true, loading: false });
          return true;
        } catch (err: any) {
          const msg =
            err?.response?.data?.message ?? "E-mail ou senha incorretos.";
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
        try {
          await CookieManager.clearAll();
        } catch {
          // best-effort — não bloqueia o logout local
        }
        set({ user: null, authenticated: false, error: null, loading: false });
      },

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "vigiageo-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ user: s.user, authenticated: s.authenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
```

- [ ] **Step 3: Remover o interceptor de request Bearer em `src/services/api.ts` e adicionar `withCredentials`**

Substituir o arquivo inteiro por:

```ts
import axios from "axios";
import { resolveBaseUrl } from "./env";

const BASE_URL = resolveBaseUrl(process.env);

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Sessão via cookie httpOnly (access_token / refresh_token, setados pelo
// backend). O React Native reenvia cookies automaticamente por origem —
// não há header Authorization manual pra montar aqui.

// Trata 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogoutRoute = error.config?.url?.includes("/auth/logout");
    const is401 = error.response?.status === 401;

    if (is401 && !isLogoutRoute) {
      import("@/src/store/authStore").then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      });
    }

    return Promise.reject(error);
  }
);
```

(A Task 5 substitui esse interceptor de resposta pela versão com refresh
automático — esta versão intermediária mantém o comportamento atual de
"desloga no 401" enquanto isolamos a limpeza do modelo de auth.)

- [ ] **Step 4: Instalar `@react-native-cookies/cookies` e remover `expo-secure-store`**

```bash
npm install @react-native-cookies/cookies@^6.2.1
npm uninstall expo-secure-store
```

**Atenção:** `@react-native-cookies/cookies` é um módulo nativo. Só recarregar
o JS (fast refresh) não é suficiente — é preciso rebuildar o dev client
(`npx expo prebuild` seguido de novo build nativo, ou uma nova build de dev
client via EAS) antes de testar este pacote no device/emulador.

- [ ] **Step 5: Remover o plugin `expo-secure-store` de `app.json`**

Em `app.json`, dentro de `expo.plugins`, remover a entrada `"expo-secure-store"`
(estava listada solta, sem opções, logo após o bloco de `expo-splash-screen`).
O array `plugins` fica:

```json
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "backgroundColor": "#000000"
          }
        }
      ]
    ],
```

(A Task 8 adiciona a entrada do `expo-location` de volta nesse array.)

- [ ] **Step 6: GATE MANUAL — reconfirmar login e chamada autenticada com o código já limpo**

Repetir o login real no device/emulador (agora com o dev client rebuildado)
e confirmar que uma tela autenticada (ex.: Dashboard) ainda carrega
normalmente — sem qualquer `console.log` temporário desta vez, só
observação da UI. Isso confirma que remover o fallback Bearer não quebrou
nada.

- [ ] **Step 7: GATE MANUAL — confirmar que o logout de fato limpa a sessão**

Deslogar pelo Perfil, depois tentar forçar uma chamada autenticada (ex.:
voltar pra uma tela que busca dado da API — o guard da Task 6 vai
redirecionar antes, então valide observando que a chamada de rede, se
disparada, retorna 401/erro de auth em vez de dado válido).

- [ ] **Step 8: Rodar a suíte automatizada (não deve ter regressão)**

Run: `npm test`
Expected: todos os testes de Task 1 e 2 continuam PASS (este task não
adiciona teste automatizado novo — a validação é o gate manual acima).

- [ ] **Step 9: Commit**

```bash
git add src/store/authStore.ts src/services/api.ts app.json package.json package-lock.json
git commit -m "fix: adotar cookies httpOnly como modelo de sessão, remover Bearer morto"
```

---

## Task 4: Módulo de dedupe de refresh

**Files:**
- Create: `src/services/refreshQueue.ts`
- Test: `src/services/refreshQueue.test.ts`

**Interfaces:**
- Produces: `dedupeRefresh(refreshFn: () => Promise<void>): Promise<void>` e
  `__resetRefreshStateForTests(): void` — usados pela Task 5.

- [ ] **Step 1: Escrever o teste (vai falhar — módulo não existe)**

Criar `src/services/refreshQueue.test.ts`:

```ts
import { dedupeRefresh, __resetRefreshStateForTests } from "./refreshQueue";

describe("dedupeRefresh", () => {
  beforeEach(() => {
    __resetRefreshStateForTests();
  });

  it("calls refreshFn once for a single call", async () => {
    const refreshFn = jest.fn().mockResolvedValue(undefined);
    await dedupeRefresh(refreshFn);
    expect(refreshFn).toHaveBeenCalledTimes(1);
  });

  it("calls refreshFn only once for concurrent calls", async () => {
    let resolveRefresh: () => void;
    const refreshFn = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        })
    );

    const p1 = dedupeRefresh(refreshFn);
    const p2 = dedupeRefresh(refreshFn);
    const p3 = dedupeRefresh(refreshFn);

    resolveRefresh!();
    await Promise.all([p1, p2, p3]);

    expect(refreshFn).toHaveBeenCalledTimes(1);
  });

  it("allows a new refresh after the previous one finishes", async () => {
    const refreshFn = jest.fn().mockResolvedValue(undefined);

    await dedupeRefresh(refreshFn);
    await dedupeRefresh(refreshFn);

    expect(refreshFn).toHaveBeenCalledTimes(2);
  });

  it("clears the in-flight promise even when refreshFn rejects", async () => {
    const refreshFn = jest
      .fn()
      .mockRejectedValueOnce(new Error("refresh failed"))
      .mockResolvedValueOnce(undefined);

    await expect(dedupeRefresh(refreshFn)).rejects.toThrow("refresh failed");
    await dedupeRefresh(refreshFn);

    expect(refreshFn).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Confirmar que falha**

Run: `npm test -- refreshQueue.test.ts`
Expected: FAIL — `Cannot find module './refreshQueue'`.

- [ ] **Step 3: Implementar `src/services/refreshQueue.ts`**

```ts
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
```

- [ ] **Step 4: Confirmar que passa**

Run: `npm test -- refreshQueue.test.ts`
Expected: PASS — 4 testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/services/refreshQueue.ts src/services/refreshQueue.test.ts
git commit -m "feat: dedupe de chamadas concorrentes de refresh de token"
```

---

## Task 5: Renovação automática de token no interceptor 401

**Files:**
- Modify: `src/services/api.ts`
- Test: `src/services/api.test.ts`

**Interfaces:**
- Consumes: `dedupeRefresh` (Task 4).
- Produces: `handleUnauthorized(error, deps): Promise<unknown>` exportado de
  `src/services/api.ts` — função pura testável, usada internamente pelo
  interceptor real registrado em `api`.

- [ ] **Step 1: Escrever o teste (vai falhar — `handleUnauthorized` não existe)**

Criar `src/services/api.test.ts`:

```ts
import type { AxiosError, AxiosRequestConfig } from "axios";
import { handleUnauthorized } from "./api";

function makeError(status: number, url: string): AxiosError {
  return {
    isAxiosError: true,
    config: { url } as AxiosRequestConfig,
    response: { status } as any,
    toJSON: () => ({}),
    name: "AxiosError",
    message: "Request failed",
  } as AxiosError;
}

describe("handleUnauthorized", () => {
  it("retries the original request after a successful refresh", async () => {
    const refresh = jest.fn().mockResolvedValue(undefined);
    const retry = jest.fn().mockResolvedValue({ data: "ok" });
    const logout = jest.fn().mockResolvedValue(undefined);

    const result = await handleUnauthorized(makeError(401, "/visitas"), {
      refresh,
      retry,
      logout,
    });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(retry).toHaveBeenCalledWith({ url: "/visitas" });
    expect(logout).not.toHaveBeenCalled();
    expect(result).toEqual({ data: "ok" });
  });

  it("logs out when the refresh itself fails", async () => {
    const refresh = jest.fn().mockRejectedValue(new Error("refresh failed"));
    const retry = jest.fn();
    const logout = jest.fn().mockResolvedValue(undefined);

    await expect(
      handleUnauthorized(makeError(401, "/visitas"), { refresh, retry, logout })
    ).rejects.toBeDefined();

    expect(logout).toHaveBeenCalledTimes(1);
    expect(retry).not.toHaveBeenCalled();
  });

  it.each(["/auth/login", "/auth/refresh", "/auth/logout"])(
    "does not attempt refresh for %s",
    async (url) => {
      const refresh = jest.fn();
      const retry = jest.fn();
      const logout = jest.fn();

      await expect(
        handleUnauthorized(makeError(401, url), { refresh, retry, logout })
      ).rejects.toBeDefined();

      expect(refresh).not.toHaveBeenCalled();
      expect(logout).not.toHaveBeenCalled();
    }
  );

  it("passes through non-401 errors unchanged", async () => {
    const refresh = jest.fn();
    const retry = jest.fn();
    const logout = jest.fn();

    await expect(
      handleUnauthorized(makeError(500, "/visitas"), { refresh, retry, logout })
    ).rejects.toBeDefined();

    expect(refresh).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Confirmar que falha**

Run: `npm test -- api.test.ts`
Expected: FAIL — `handleUnauthorized` não é exportado por `./api`.

- [ ] **Step 3: Implementar em `src/services/api.ts`**

Substituir o bloco final (`// Trata 401` até o fim do arquivo) por:

```ts
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

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) =>
    handleUnauthorized(error, {
      refresh: () => api.post("/auth/refresh").then(() => undefined),
      retry: (config) => api.request(config),
      logout: () =>
        import("@/src/store/authStore").then(({ useAuthStore }) =>
          useAuthStore.getState().logout()
        ),
    })
);
```

O arquivo completo (imports + `api` + este bloco) deve ficar assim, de cima
a baixo:

```ts
import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";
import { resolveBaseUrl } from "./env";
import { dedupeRefresh } from "./refreshQueue";

const BASE_URL = resolveBaseUrl(process.env);

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const AUTH_ROUTES_WITHOUT_REFRESH = ["/auth/login", "/auth/refresh", "/auth/logout"];

function isAuthRouteWithoutRefresh(url: string | undefined): boolean {
  return (
    !!url && AUTH_ROUTES_WITHOUT_REFRESH.some((route) => url.includes(route))
  );
}

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

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) =>
    handleUnauthorized(error, {
      refresh: () => api.post("/auth/refresh").then(() => undefined),
      retry: (config) => api.request(config),
      logout: () =>
        import("@/src/store/authStore").then(({ useAuthStore }) =>
          useAuthStore.getState().logout()
        ),
    })
);
```

- [ ] **Step 4: Confirmar que passa**

Run: `npm test -- api.test.ts`
Expected: PASS — 6 testes passando (4 `it` + 3 do `it.each`, total 6).

- [ ] **Step 5: Rodar a suíte inteira**

Run: `npm test`
Expected: todos os testes de todas as tasks anteriores continuam PASS.

- [ ] **Step 6: GATE MANUAL — confirmar renovação transparente no device**

No backend local, reduza temporariamente `auth_custom.access_ttl` (ou espere
o TTL de 60min padrão passar) pra forçar um 401 numa chamada autenticada;
confirme que o app renova sozinho e a tela carrega sem pedir login de novo.
Reverta qualquer alteração temporária de TTL no backend depois do teste.

- [ ] **Step 7: Commit**

```bash
git add src/services/api.ts src/services/api.test.ts
git commit -m "feat: renovar token automaticamente via /auth/refresh no 401"
```

---

## Task 6: Guarda de rota no grupo `(app)`

**Files:**
- Create: `src/utils/authGuard.ts`
- Test: `src/utils/authGuard.test.ts`
- Modify: `app/(app)/_layout.tsx`

**Interfaces:**
- Produces: `shouldRedirectToLogin(hydrated: boolean, authenticated: boolean): boolean`
  — usado em `app/(app)/_layout.tsx` (e disponível pra Task 7 se precisar).

- [ ] **Step 1: Escrever o teste (vai falhar — módulo não existe)**

Criar `src/utils/authGuard.test.ts`:

```ts
import { shouldRedirectToLogin } from "./authGuard";

describe("shouldRedirectToLogin", () => {
  it("returns false while the store has not hydrated yet", () => {
    expect(shouldRedirectToLogin(false, false)).toBe(false);
  });

  it("returns true once hydrated and not authenticated", () => {
    expect(shouldRedirectToLogin(true, false)).toBe(true);
  });

  it("returns false once hydrated and authenticated", () => {
    expect(shouldRedirectToLogin(true, true)).toBe(false);
  });
});
```

- [ ] **Step 2: Confirmar que falha**

Run: `npm test -- authGuard.test.ts`
Expected: FAIL — `Cannot find module './authGuard'`.

- [ ] **Step 3: Implementar `src/utils/authGuard.ts`**

```ts
export function shouldRedirectToLogin(
  hydrated: boolean,
  authenticated: boolean
): boolean {
  return hydrated && !authenticated;
}
```

- [ ] **Step 4: Confirmar que passa**

Run: `npm test -- authGuard.test.ts`
Expected: PASS — 3 testes passando.

- [ ] **Step 5: Adicionar a guarda em `app/(app)/_layout.tsx`**

No topo do arquivo, adicionar aos imports existentes:

```ts
import { Tabs, Redirect } from "expo-router";
```

(substitui a linha `import { Tabs } from "expo-router";` original) e logo
abaixo dos outros imports:

```ts
import { useAuthStore } from "@/src/store/authStore";
import { shouldRedirectToLogin } from "@/src/utils/authGuard";
```

Na função `AppLayout`, primeira linha do corpo (antes do `return`):

```ts
export default function AppLayout() {
  const { authenticated, hydrated } = useAuthStore();

  if (shouldRedirectToLogin(hydrated, authenticated)) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Tabs
      ...
```

(o resto da função continua idêntico ao que já existe.)

- [ ] **Step 6: Rodar a suíte inteira**

Run: `npm test`
Expected: todos os testes continuam PASS.

- [ ] **Step 7: GATE MANUAL — confirmar o redirect em deep link deslogado**

Deslogar no app. Em seguida, tentar reabrir diretamente numa rota do grupo
`(app)` (ex.: `npx uri-scheme open vigilanciamobile://(app)/visitas --ios`
ou o equivalente Android via `adb shell am start -a android.intent.action.VIEW
-d "vigilanciamobile://(app)/visitas"`) e confirmar que cai em `/(auth)` em
vez de mostrar a tela protegida.

- [ ] **Step 8: Commit**

```bash
git add src/utils/authGuard.ts src/utils/authGuard.test.ts "app/(app)/_layout.tsx"
git commit -m "fix: adicionar guarda de autenticação no layout do grupo (app)"
```

---

## Task 7: Logout automático por inatividade (15 minutos, sobrevive a force-kill)

**Files:**
- Create: `src/utils/inactivity.ts`
- Test: `src/utils/inactivity.test.ts`
- Create: `src/hooks/useInactivityLogout.ts`
- Modify: `app/(app)/_layout.tsx`

**Interfaces:**
- Consumes: `useAuthStore.getState().logout(): Promise<void>` (Task 3).
- Produces: `useInactivityLogout(): void`, usado em
  `app/(app)/_layout.tsx`.

### Limitação conhecida (documentada de propósito, não é bug)

O check de cold-start roda dentro do `useEffect` do hook, que só monta
depois que a guarda da Task 6 já decidiu renderizar o `Tabs` (porque nesse
momento `authenticated` ainda está `true`, vindo do estado persistido). Isso
pode causar um flash de um frame da UI autenticada antes do logout assíncrono
terminar e o redirect acontecer. Não é um bypass de segurança — a sessão real
é validada pelo backend via TTL do cookie (60min access / 7 dias refresh);
este timeout client-side é defesa em profundidade/UX, não a única barreira.
Eliminar o flash exigiria mover o check pra `app/index.tsx` antes de decidir
o redirect inicial, o que está fora do escopo deste pacote.

- [ ] **Step 1: Escrever os testes de `isInactivityTimeoutExceeded` e `checkAndLogoutIfExpired` (vão falhar — módulo não existe)**

Criar `src/utils/inactivity.test.ts`:

```ts
import {
  isInactivityTimeoutExceeded,
  checkAndLogoutIfExpired,
  INACTIVITY_THRESHOLD_MS,
} from "./inactivity";

describe("isInactivityTimeoutExceeded", () => {
  it("returns false when there is no backgrounded timestamp", () => {
    expect(isInactivityTimeoutExceeded(null, Date.now())).toBe(false);
  });

  it("returns false when under the threshold", () => {
    const now = 1_000_000;
    const backgroundedAt = now - (INACTIVITY_THRESHOLD_MS - 1000);
    expect(isInactivityTimeoutExceeded(backgroundedAt, now)).toBe(false);
  });

  it("returns true when at or over the threshold", () => {
    const now = 1_000_000;
    const backgroundedAt = now - INACTIVITY_THRESHOLD_MS;
    expect(isInactivityTimeoutExceeded(backgroundedAt, now)).toBe(true);
  });

  it("respects a custom threshold", () => {
    const now = 1_000_000;
    expect(isInactivityTimeoutExceeded(now - 5000, now, 10_000)).toBe(false);
    expect(isInactivityTimeoutExceeded(now - 10_000, now, 10_000)).toBe(true);
  });
});

describe("checkAndLogoutIfExpired", () => {
  it("does not log out when there is no stored timestamp", async () => {
    const logout = jest.fn();
    await checkAndLogoutIfExpired({
      getStoredTimestamp: async () => null,
      clearStoredTimestamp: jest.fn().mockResolvedValue(undefined),
      logout,
    });
    expect(logout).not.toHaveBeenCalled();
  });

  it("logs out when the stored timestamp exceeds the threshold", async () => {
    const logout = jest.fn().mockResolvedValue(undefined);
    const clearStoredTimestamp = jest.fn().mockResolvedValue(undefined);
    const now = 1_000_000;
    const backgroundedAt = now - INACTIVITY_THRESHOLD_MS;

    await checkAndLogoutIfExpired({
      getStoredTimestamp: async () => String(backgroundedAt),
      clearStoredTimestamp,
      logout,
      now: () => now,
    });

    expect(logout).toHaveBeenCalledTimes(1);
    expect(clearStoredTimestamp).toHaveBeenCalledTimes(1);
  });

  it("does not log out when under the threshold", async () => {
    const logout = jest.fn();
    const now = 1_000_000;
    const backgroundedAt = now - 1000;

    await checkAndLogoutIfExpired({
      getStoredTimestamp: async () => String(backgroundedAt),
      clearStoredTimestamp: jest.fn().mockResolvedValue(undefined),
      logout,
      now: () => now,
    });

    expect(logout).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Confirmar que falha**

Run: `npm test -- inactivity.test.ts`
Expected: FAIL — `Cannot find module './inactivity'`.

- [ ] **Step 3: Implementar `src/utils/inactivity.ts`**

```ts
export const INACTIVITY_THRESHOLD_MS = 15 * 60 * 1000;

export function isInactivityTimeoutExceeded(
  backgroundedAt: number | null,
  now: number,
  thresholdMs: number = INACTIVITY_THRESHOLD_MS
): boolean {
  if (backgroundedAt === null) return false;
  return now - backgroundedAt >= thresholdMs;
}

export async function checkAndLogoutIfExpired(deps: {
  getStoredTimestamp: () => Promise<string | null>;
  clearStoredTimestamp: () => Promise<void>;
  logout: () => Promise<void>;
  now?: () => number;
}): Promise<void> {
  const stored = await deps.getStoredTimestamp();
  const backgroundedAt = stored ? Number(stored) : null;
  const now = (deps.now ?? Date.now)();

  if (isInactivityTimeoutExceeded(backgroundedAt, now)) {
    await deps.logout();
  }

  await deps.clearStoredTimestamp();
}
```

- [ ] **Step 4: Confirmar que passa**

Run: `npm test -- inactivity.test.ts`
Expected: PASS — 7 testes passando.

- [ ] **Step 5: Criar `src/hooks/useInactivityLogout.ts`**

```ts
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/src/store/authStore";
import { checkAndLogoutIfExpired } from "@/src/utils/inactivity";

const STORAGE_KEY = "vigiageo-backgrounded-at";

const deps = {
  getStoredTimestamp: () => AsyncStorage.getItem(STORAGE_KEY),
  clearStoredTimestamp: () => AsyncStorage.removeItem(STORAGE_KEY),
  logout: () => useAuthStore.getState().logout(),
};

/**
 * Desloga automaticamente se o app ficou em background por >= 15min —
 * inclusive se o processo foi encerrado nesse meio tempo (o timestamp é
 * persistido em AsyncStorage, não só em memória, e o check roda de novo
 * no mount, cobrindo o cold start).
 */
export function useInactivityLogout(): void {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    checkAndLogoutIfExpired(deps);

    const subscription = AppState.addEventListener(
      "change",
      (next: AppStateStatus) => {
        if (appState.current === "active" && next.match(/inactive|background/)) {
          AsyncStorage.setItem(STORAGE_KEY, String(Date.now()));
        }

        if (appState.current.match(/inactive|background/) && next === "active") {
          checkAndLogoutIfExpired(deps);
        }

        appState.current = next;
      }
    );

    return () => subscription.remove();
  }, []);
}
```

- [ ] **Step 6: Ligar o hook em `app/(app)/_layout.tsx`**

Adicionar aos imports:

```ts
import { useInactivityLogout } from "@/src/hooks/useInactivityLogout";
```

E dentro de `AppLayout`, logo após a linha `const { authenticated, hydrated } = useAuthStore();` (adicionada na Task 6):

```ts
export default function AppLayout() {
  const { authenticated, hydrated } = useAuthStore();
  useInactivityLogout();

  if (shouldRedirectToLogin(hydrated, authenticated)) {
    return <Redirect href="/(auth)" />;
  }
  ...
```

- [ ] **Step 7: Rodar a suíte inteira**

Run: `npm test`
Expected: todos os testes continuam PASS.

- [ ] **Step 8: GATE MANUAL — confirmar o timeout em dois cenários**

1. Logar no app, colocar em background (botão home) e esperar 15min (ou
   reduzir temporariamente `INACTIVITY_THRESHOLD_MS` pra 30s só pra este
   teste, revertendo depois) → voltar ao app e confirmar que caiu pra tela
   de login.
2. Repetir o cenário acima, mas **forçar o fechamento do processo** (não só
   background — matar o app pelo app switcher) durante a janela de espera
   → reabrir o app do zero e confirmar que ainda desloga (é exatamente o
   gap que a persistência em AsyncStorage resolve).

- [ ] **Step 9: Commit**

```bash
git add src/utils/inactivity.ts src/utils/inactivity.test.ts src/hooks/useInactivityLogout.ts "app/(app)/_layout.tsx"
git commit -m "feat: logout automático por inatividade em background (15min)"
```

---

## Task 8: Permissões de localização no `app.json`

**Files:**
- Modify: `app.json`

**Interfaces:** nenhuma — configuração de build, sem código JS.

- [ ] **Step 1: Adicionar o plugin `expo-location` em `app.json`**

No array `expo.plugins` (que, depois da Task 3, contém só `"expo-router"` e
o bloco de `expo-splash-screen`), adicionar uma terceira entrada:

```json
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "backgroundColor": "#000000"
          }
        }
      ],
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "O VigiaGeo usa sua localização para registrar as coordenadas de imóveis e ocorrências durante as visitas de campo."
        }
      ]
    ],
```

- [ ] **Step 2: Validar o `app.json`**

Run: `node -e "JSON.parse(require('fs').readFileSync('app.json', 'utf8')); console.log('app.json válido')"`
Expected: `app.json válido` (confirma que não há erro de sintaxe JSON).

- [ ] **Step 3: GATE MANUAL — confirmar que o prebuild aplica a permissão**

Run: `npx expo prebuild --clean`
Depois, inspecionar:
- iOS: `ios/vigilanciamobile/Info.plist` deve conter a chave
  `NSLocationWhenInUseUsageDescription` com o texto configurado.
- Android: `android/app/src/main/AndroidManifest.xml` deve conter
  `<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />`
  e `ACCESS_COARSE_LOCATION`.

(Lembrete: `/ios` e `/android` são gerados e ignorados pelo git — ver
`.gitignore:42-43` — então esse passo é só validação local, não gera diff
pra commitar.)

- [ ] **Step 4: Commit**

```bash
git add app.json
git commit -m "feat: declarar permissão de localização (expo-location) no app.json"
```

---

## Resumo de dependências entre tasks

```
Task 1 (infra de teste)
  └─ Task 2 (env var)
       └─ Task 3 (cookies/auth cleanup)
            └─ Task 4 (dedupe refresh) ── independente de Task 3, mas feita depois por ordem de leitura
                 └─ Task 5 (wire refresh no interceptor)
                      └─ Task 6 (guarda de rota)
                           └─ Task 7 (inatividade)
Task 8 (permissões) ── independente, pode rodar a qualquer momento após Task 3 (que mexeu no mesmo array de plugins)
```
