# Pacote de Hardening de Segurança — VigiaGeo Mobile

Data: 2026-07-14
Origem: itens 1, 4, 5, 6, 8, 9 de `docs/AUDITORIA_MOBILE.md`.
Repos envolvidos: `vigilancia-mobile` (todo o trabalho). O backend
(`vigilancia-geo-backend`, path irmão `C:\Users\victo\Desktop\vigilancia-geo-backend`)
**não é alterado** — só foi lido para confirmar o contrato real de auth.

## Descoberta que redefiniu o escopo

A investigação original assumia que o app guardava um JWT Bearer real em
AsyncStorage (achado CRÍTICO #1 da auditoria). Ao checar o backend
(`AuthController::login`, `InjectAccessTokenFromCookie`, `AutenticatedUserResource`),
ficou claro que:

- `POST /auth/login` seta `access_token` e `refresh_token` como cookies
  **httpOnly** (`Secure` em produção, `SameSite=Lax`/`Strict`). O corpo JSON
  da resposta **não** inclui `access_token` — o método
  `AutenticatedUserResource::toArrayWithToken()`, que existe exatamente pra
  isso, nunca é chamado em lugar nenhum do backend.
- Logo, `data.access_token ?? data.token ?? null` em `authStore.ts:49`
  sempre resolve pra `null`. O header `Authorization: Bearer` que o app
  acha que está enviando nunca é enviado pelo código JS.
- As requisições autenticadas hoje só funcionam porque (a) o React Native
  persiste e reenvia cookies automaticamente por origem, igual um browser, e
  (b) o middleware `InjectAccessTokenFromCookie` do backend lê o cookie
  `access_token` e injeta o header `Authorization` no lado do servidor.
- `POST /auth/refresh` segue o mesmo padrão: lê `refresh_token` só do
  cookie, sem precisar de nada no body da requisição.

**Decisão (aprovada pelo usuário):** adotar o modelo de cookies httpOnly como
fonte de verdade da sessão, em vez de "consertar" o backend pra devolver o
token no corpo. Isso é estritamente mais seguro (o token nunca é legível por
código JS/RN, então SecureStore vira desnecessário para ele) e não exige
nenhuma mudança no backend.

## Itens do pacote

### 1. Limpeza do modelo de auth (substitui a migração pra SecureStore)

**Arquivos:** `src/store/authStore.ts`, `src/services/api.ts`, `package.json`

- `authStore`: remover o campo `token` e toda tentativa de lê-lo da resposta
  de login. `persist`/`partialize` passa a guardar só `{ user, authenticated }`
  em AsyncStorage (não sensíveis — sem token, não há segredo pra proteger
  aqui).
- `api.ts`: remover o interceptor de request que tenta setar
  `Authorization` a partir do `authStore` (código morto, já que `token` nunca
  existiu de fato). Configurar o client para cookies:
  ```ts
  export const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    withCredentials: true, // inócuo em RN, documenta a intenção
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  });
  ```
- Adicionar dependência `@react-native-cookies/cookies` (módulo nativo —
  aceitável porque o projeto já usa dev client por causa de
  `react-native-maps`/`expo-sqlite`, não Expo Go puro). Usado em dois pontos:
  - `logout()` no `authStore`: depois de chamar `POST /auth/logout` (que já
    expira os cookies via `Set-Cookie`), chamar
    `CookieManager.clearAll()` como reforço — cobre o caso de logout
    disparado sem rede (timeout de inatividade, por exemplo), onde a
    resposta do servidor nunca chega.
  - Timeout de inatividade (item 3): mesmo tratamento.
- **Risco a validar na implementação:** confirmar empiricamente (login real
  + inspeção de `res.headers['set-cookie']` ou teste manual no dispositivo)
  que o cookie jar do RN está de fato persistindo e reenviando os cookies
  entre chamadas antes de remover o fallback Bearer. Se por algum motivo
  **não** estiver funcionando hoje (o que explicaria bugs de auth
  intermitentes), a app quebra até esse ponto ser resolvido — não dá pra
  assumir cegamente. Isso vira o primeiro passo de verificação do plano de
  implementação, antes de remover qualquer código existente.

### 2. Renovação automática de token via `/auth/refresh`

**Arquivo:** `src/services/api.ts`

- No interceptor de resposta, ao receber 401 numa rota que não seja
  `/auth/login`, `/auth/refresh` ou `/auth/logout`:
  1. Se já existe um refresh em andamento, aguarda essa mesma promise
     (mutex/dedup) em vez de disparar outro — evita corrida quando várias
     requisições tomam 401 ao mesmo tempo e o backend rotaciona o refresh
     token a cada uso (`AuthService::refresh` deleta o `refreshToken` antigo
     e gera um novo).
  2. Chama `POST /auth/refresh` (sem body).
  3. Sucesso → reenfileira a requisição original (o novo cookie
     `access_token` já foi setado pela resposta) e resolve.
  4. Falha → segue o comportamento atual (`logout()` + limpeza de estado).
- Sem alteração de contrato com o backend — endpoint já existe e já se
  comporta assim.

### 3. Logout automático por inatividade (15 minutos)

**Arquivo novo:** `src/hooks/useInactivityLogout.ts`, usado em
`app/(app)/_layout.tsx`

- Baseado em `AppState`, não em toque-a-toque na tela: grava
  `Date.now()` em **AsyncStorage** (não só em memória) quando o app sai de
  `active` (vai pra `background`/`inactive`); ao voltar pra `active`, se
  `Date.now() - timestamp >= 15 * 60 * 1000`, chama `logout()` e redireciona
  pra `/(auth)`.
- Justificativa da escolha (vs. rastrear inatividade de toque): o padrão de
  uso de um agente preenchendo um formulário de visita por vários minutos
  na mesma tela não deveria ser tratado como "inativo" — o risco real que
  essa regra mitiga é o aparelho ficar destravado e sem supervisão
  (guardado no bolso, esquecido), que é exatamente o que "tempo em
  background" captura.
- **Gap pego na autorrevisão:** se o timestamp ficasse só em memória, matar o
  app (force-kill) durante a janela de 15min apagaria o estado e o timeout
  nunca disparia na reabertura — brecha óbvia. Por isso o timestamp precisa
  ser persistido (AsyncStorage) e **também checado no cold start**, logo após
  a hidratação do `authStore` e antes de liberar a navegação pro grupo
  `(app)`, não só na transição de `AppState` com o JS runtime já vivo.

### 4. Permissões de localização no `app.json`

**Arquivo:** `app.json`

- Adicionar `expo-location` à lista de `plugins`, com
  `NSLocationWhenInUseUsageDescription` em pt-BR explicando o uso (captura
  de coordenadas ao registrar imóveis/ocorrências). As permissões Android
  (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`) são injetadas
  automaticamente pelo plugin no prebuild — não precisam de bloco manual.
- Este item **não** inclui a captura de geolocalização em si (isso é o
  item 2 da auditoria geral, fora deste pacote) — só desbloqueia
  tecnicamente que ela possa ser pedida no futuro sem quebrar em produção
  iOS.

### 5. Guarda de rota no layout `(app)`

**Arquivo:** `app/(app)/_layout.tsx`

- Replicar a checagem que hoje só existe em `app/index.tsx`
  (`authenticated`/`hydrated` do `authStore`) dentro do próprio layout do
  grupo `(app)`: se hidratado e não autenticado, `<Redirect href="/(auth)" />`.
  Cobre entrada direta no grupo por deep link ou restauração de navegação.

### 6. URL da API via variável de ambiente

**Arquivos:** `.env` (novo, comitado — só tem o default de dev, não é
segredo), `.env.example` (novo), `src/services/api.ts`, `.gitignore`

- `EXPO_PUBLIC_API_URL=http://192.168.15.24:8000/api` em `.env` (suporte
  nativo a `EXPO_PUBLIC_*` no Expo SDK 54, sem lib adicional).
- `api.ts`: `const BASE_URL = process.env.EXPO_PUBLIC_API_URL;` seguido de um
  `throw` imediato no carregamento do módulo se a variável estiver ausente/
  vazia (falha alto e cedo — sem isso o axios usaria `baseURL: undefined` e o
  erro só apareceria depois, disfarçado de falha de rede em qualquer tela).
- `.gitignore` já ignora `.env*.local`; não precisa mudar nada ali — o
  `.env` de dev fica versionado de propósito, igual ao valor hardcoded que
  substitui.
- Quando existir URL de produção HTTPS, sobrescrever via variável de
  ambiente do build profile do EAS — sem tocar em código.

## Fora de escopo deste pacote

- Captura de geolocalização em si (item 2 da auditoria geral).
- Correção da tela "Nova Ocorrência" mockada (item 3 da auditoria geral).
- Biometria (item 15, baixa prioridade, opcional).
- Qualquer mudança no repositório `vigilancia-geo-backend`.

## Testes

- Unitário: `useInactivityLogout` (transições de `AppState` cruzando o
  limiar de 15min disparam logout; abaixo do limiar não disparam).
- Unitário: mutex do interceptor de refresh (duas chamadas 401 simultâneas
  resultam em uma única chamada a `/auth/refresh`).
- Manual (obrigatório, não dá pra automatizar sem dispositivo/emulador):
  1. Login → confirmar que chamadas subsequentes autenticam via cookie
     (sem qualquer header `Authorization` setado pelo app).
  2. Deixar o access token expirar (ou forçar 401) → confirmar retry
     transparente via refresh.
  3. Logout → confirmar que uma chamada autenticada seguinte falha (cookies
     de fato limpos).
  4. App em background por >15min → confirmar logout ao voltar.
  5. App em background por >15min, mas **forçando o fechamento do processo**
     nesse meio tempo → reabrir e confirmar que ainda desloga (cobre o gap
     achado na autorrevisão do item 3).
  6. Deep link direto pra dentro de `(app)` deslogado → confirmar redirect.
