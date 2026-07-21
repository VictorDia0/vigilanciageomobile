# CLAUDE.md — SISVA Mobile

## Sobre o desenvolvedor

**Victor Dias Pereira** — Agente de combate a endemias na prefeitura de Almenara/MG, com conhecimento direto de operações de campo (visitas domiciliares, controle de focos, ciclos de tratamento). Está construindo o SISVA como projeto pessoal e futuro produto para vender pra prefeituras. Também é ourives profissional (alianças 18k e prata 925 há ~7 anos, marca própria) e está se preparando pro ENEM.

Trabalha em **Windows com Git Bash / PowerShell e VS Code**. Preferência forte por respostas técnicas nível sênior — direto, sem repetir contexto óbvio, sem over-explicação.

## Sobre o projeto (SISVA)

**SISVA — Sistema de Vigilância Ambiental.** Plataforma web + mobile de gestão de operações de vigilância ambiental / controle de endemias para prefeituras.

**Público-alvo do mobile:** Agentes de campo (roles `agente`) que fazem visitas domiciliares. Precisam funcionar **offline** (rede instável em campo), com GPS ativado, e sincronizar quando voltarem à cobertura.

**Escopo funcional do mobile:**
- Login com credenciais do agente
- Lista de imóveis atribuídos por quadra
- Registro de visita com foto, coordenadas, status
- Registro de ocorrência (foco, denúncia) georreferenciada
- Perfil e histórico do agente

## Stack deste repo

- **Expo SDK** com **expo-router** (file-based routing)
- **TypeScript**
- **expo-secure-store** para tokens (não @react-native-cookies)
- **expo-location** para GPS
- **New Architecture habilitada** (`newArchEnabled: true`)
- **Axios** para HTTP com Bearer token
- **Zustand** para state global (authStore)

## Arquitetura deste repo

### Estrutura de rotas (expo-router)

```
app/
  index.tsx           — root, redireciona baseado em auth
  (auth)/
    _layout.tsx       — layout do fluxo não autenticado
    index.tsx         — tela de login
  (app)/
    _layout.tsx       — Tabs layout (com HapticTab, OfflineBanner)
    index.tsx         — home autenticada
    areas/            — telas de áreas
    ocorrencias/      — telas de ocorrências
    visitas/          — telas de visita, incluindo recuperacao.tsx
    perfil/           — perfil do agente
```

Grupos com parênteses `(auth)`, `(app)`, `(tabs)` são **organizacionais** — não aparecem na URL. Servem pra aplicar layouts diferentes por área.

### Autenticação

- Login retorna JWT como Bearer token no JSON (não usa cookies)
- Token guardado em `expo-secure-store` (não localStorage, não AsyncStorage)
- Axios interceptor injeta `Authorization: Bearer TOKEN` em cada request
- `authStore` (Zustand) mantém `user`, `token`, `hydrated`, `authenticated`
- `authGuard.ts` decide redirect: `shouldRedirectToLogin(hydrated, authenticated)`

### Camadas

- **UI (`app/**/*.tsx`, `src/components/*`)** — só renderiza
- **Hooks (`src/hooks/*`)** — `useInactivityLogout`, `useNetworkSync`, etc
- **Services (`src/services/*`)** — HTTP: `ocorrenciaService`, `locationService`, `authService`
- **Store (`src/store/*`)** — Zustand stores globais
- **Utils (`src/utils/*`)** — helpers puros

## Tom de voz e comunicação

- **Português (Brasil)**, direto, sem gerúndios de call center
- **Nível sênior**: assumir que o dev entende termos técnicos
- **Uma coisa de cada vez**: responder à pergunta feita
- **Códigos completos, não fragmentos**
- **Sem apologias ou preâmbulo**
- **Emojis só em milestones**

## Regras de trabalho

1. **Não usar `@react-native-cookies/cookies`.** Não funciona em Expo Go. Usar `expo-secure-store` para tokens.

2. **Não usar `react-native-maps` em Expo Go.** Precisa de dev build (`expo-dev-client` + `eas build --profile development`). Se realmente precisar de mapa nativo, é dev build. Caso contrário, considerar `react-native-webview` com Leaflet.

3. **React Compiler está desabilitado.** `"reactCompiler": false` no `app.json`. Conflita com plugin `importExportLiveBindings` do `@expo/metro-config` em types Flow do RN core (bug conhecido). Não reativar sem confirmar que foi resolvido upstream.

4. **Se der OOM no bundle** (`jest-worker` crash), usar `NODE_OPTIONS=--max-old-space-size=8192` antes de `npx expo start`. Node 22.13 tem bug conhecido — atualizar para 22.17+ ou 20 LTS resolve.

5. **Métodos HTTP dos services devem bater com o backend.**

6. **API URL vem de env, não hardcoded.** `EXPO_PUBLIC_API_URL` no `.env` — em prod, aponta pra `https://vigilancia-api.onrender.com/api`.

7. **Não usar `console.log` em commit.** Debug via React Native Debugger ou logs do Metro.

## Critérios de qualidade

- **Offline-first onde faz sentido.** Formulários de visita/ocorrência precisam funcionar sem rede e sincronizar depois. Usar SQLite (`expo-sqlite`) ou fila em `SecureStore` como buffer.
- **Feedback tátil e visual.** Botões primários com `HapticFeedback` (`Haptics.impactAsync`).
- **Loading e erro sempre tratados.** Toda chamada de API tem estados visíveis.
- **Permissões pedidas na hora certa.** Não pedir GPS/câmera no boot — pedir quando o agente tocar em "Registrar visita" pela primeira vez.
- **Componentes acessíveis.** `accessibilityLabel` em elementos interativos.
- **Bundle mínimo.** Cada lib nova adiciona MB no APK. Justificar antes de adicionar.

## Estado atual (produção)

- **Backend consumido:** https://vigilancia-api.onrender.com
- **Env em prod:** `EXPO_PUBLIC_API_URL=https://vigilancia-api.onrender.com/api`
- **Env local (rede WiFi):** `EXPO_PUBLIC_API_URL=http://192.168.15.24:8000/api`
- **Package Android:** `com.anonymous.vigilanciamobile` (precisa mudar antes do release)
- **Login em prod:** com credenciais de agente cadastrado (`joao@agente.com` etc. só existem em local)

## Comandos frequentes

```bash
# Desenvolvimento
npx expo start -c            # start com cache limpo
NODE_OPTIONS=--max-old-space-size=8192 npx expo start -c   # com mais RAM se der OOM

# Rodar backend local pro mobile enxergar
php artisan serve --host=0.0.0.0 --port=8000

# Verificar IP local do PC (usar como API_URL do mobile)
ipconfig | grep IPv4
```

## O que Claude nunca deve esquecer

1. **Expo Go tem limitações.** Módulos que exigem código nativo não presente no Expo Go crashaam com "Invariant Violation" no import. Se aparecer, mover pra dev build ou trocar a lib.

2. **File-based routing tem armadilhas.** `(auth)/index.tsx` é `/(auth)` na URL renderizada como `/`. O grupo em parênteses não vai pra URL.

3. **`ok` do fetch/axios ≠ sucesso do domínio.** Backend pode retornar `200` com `{success: false, message: "..."}`. Checar sempre.

4. **Rede em campo é lenta e instável.** Timeouts padrão são otimistas — usar 30s+ para POSTs, retry com backoff.

5. **Baterias de agentes são limitadas.** GPS de alta precisão consome bateria — usar `Accuracy.Balanced` como default, `.High` só quando registrar visita.

6. **`Vigia Geo` foi renomeado para `SISVA`.** Se aparecer o nome antigo, é resíduo — substituir.

7. **Nunca commitar credenciais.** `.env` no `.gitignore`.
