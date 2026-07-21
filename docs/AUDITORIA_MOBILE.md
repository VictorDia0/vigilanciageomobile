# Auditoria — VigiaGeo Mobile (app de campo)

Data: 2026-07-14
Escopo: `app/`, `src/` (Expo Router + TypeScript). Não inclui o backend Laravel.

## Contexto importante para quem for ler isto depois

Este app **não é um projeto genérico de "vigilância + ocorrências + mapa livre"**.
É um app de campo para controle de endemias organizado em uma hierarquia rígida
**Área → Quadra → Imóvel → Visita (sessão) → Tratamento**, com uma máquina de
estados bem definida (ver `docs/FLUXO.md`). Essa estrutura já resolve boa parte
do que normalmente seria "tela de mapa geral com raio de atuação": o agente
nunca navega livremente, ele sempre entra por Área → Quadra, o que já limita o
alcance dele. Qualquer decisão de produto abaixo deve respeitar esse modelo, não
o generalizar de volta para um mapa livre.

Achados estão marcados **CRÍTICO / ALTA / MÉDIA / BAIXA**, com arquivo:linha e
esforço estimado.

---

## 1. Segurança

### 🔴 CRÍTICO — Token JWT salvo em AsyncStorage, não em SecureStore
`src/store/authStore.ts:2-3,76-78`. O `authStore` usa
`persist(..., { storage: createJSONStorage(() => AsyncStorage) })`, guardando
`token` e `user` em texto puro no AsyncStorage. `expo-secure-store` já está
instalado (`package.json:38`) e configurado como plugin (`app.json:42`), mas
**não é usado em lugar nenhum do código** — confirmado por busca no projeto
inteiro. Em Android, AsyncStorage é um arquivo SQLite legível por qualquer
processo com acesso root/debug ou por um backup do app (se `allowBackup` não
estiver desabilitado). Isso expõe o JWT do agente.
**Correção:** mover só o `token` para SecureStore (que é sync-store-like via
`getItemAsync`/`setItemAsync`, então precisa de um adapter customizado para o
zustand `persist`, já que a API é assíncrona nos dois lados mas
`createJSONStorage` espera `getItem`/`setItem`/`removeItem` — o adapter é
trivial). Manter `user` (não sensível) em AsyncStorage é aceitável.
**Esforço:** pequeno (~1-2h).

### 🟠 ALTA — Sem renovação automática de token
`src/services/api.ts:24-38`. O interceptor de resposta só reage a 401 fazendo
`logout()` imediato — não existe endpoint `/auth/refresh` chamado em nenhum
lugar, apesar do briefing original mencionar refresh token. Resultado: o
agente é deslogado no meio do dia em campo sempre que o token expira, mesmo
com um refresh token válido disponível no backend. Isso é especialmente ruim
para um app usado em campo, onde reautenticar pode significar perder contexto
de uma visita em andamento.
**Correção:** se o backend expõe `/auth/refresh`, implementar fila de retry no
interceptor 401 (tentar refresh uma vez, reenfileirar a requisição original,
só deslogar se o refresh também falhar).
**Esforço:** médio (~3-4h), depende do contrato do backend.

### 🟠 ALTA — Sem logout automático por inatividade
Não há nenhum mecanismo de expiração por inatividade em nenhuma tela — busca
por termos como "inactivity", timers de sessão, `AppState` não retornou nada
relevante. Um celular de agente perdido/roubado destravado mantém sessão
válida indefinidamente (limitado só pela expiração do próprio JWT).
**Correção:** hook simples com `AppState` + timestamp da última interação,
force-logout após N minutos em background.
**Esforço:** pequeno (~2h).

### 🟡 MÉDIA — Guarda de rota só na raiz, não nos grupos
`app/index.tsx:16-18` faz o `Redirect` com base em `authenticated`, mas
`app/(app)/_layout.tsx` e `app/(auth)/_layout.tsx` não verificam nada por
conta própria — são só `Tabs`/`Stack` sem guarda. Isso funciona no fluxo normal
(login → `router.replace`), mas qualquer entrada direta no grupo `(app)`
(deep link, restauração de estado de navegação do Android) não é
re-verificada nesse nível.
**Correção:** mover a checagem de `authenticated`/`hydrated` para dentro de
`app/(app)/_layout.tsx` também (`Redirect` para `/(auth)` se não autenticado).
**Esforço:** pequeno (~1h).

### 🟡 MÉDIA — Base URL de API hardcoded, sem HTTPS, sem `.env`
`src/services/api.ts:3` — `http://192.168.15.24:8000/api` fixo no código-fonte,
em HTTP (não HTTPS), sem variável de ambiente. Isso só funciona na rede local
do desenvolvedor e viaja em texto plano quando o app for de fato usado em
campo. Não há `.env.example` no projeto.
**Correção:** `expo-constants`/`EAS` env vars por build profile
(dev/staging/prod), URL de produção obrigatoriamente HTTPS.
**Esforço:** pequeno (~1-2h).

### 🟢 BAIXA — Sem biometria
Opcional no briefing original. Não implementado. Só vale a pena depois do
SecureStore estar em uso (biometria protegendo o acesso ao token faz sentido
depois, não antes).

---

## 2. Geolocalização

### 🔴 CRÍTICO — `expo-location` instalado e configurado, mas **zero uso no código**
Confirmado por busca: nenhuma chamada a `Location.getCurrentPositionAsync`,
`requestForegroundPermissionsAsync` ou qualquer símbolo de `expo-location` em
`app/` ou `src/`. Nenhuma tela — nem registro de imóvel
(`TelaFormImovel`/`useVisitas.ts`), nem nova ocorrência
(`src/features/ocorrencias/nova.tsx`) — captura latitude/longitude no momento
do registro. Isso é uma lacuna funcional central: o `OcorrenciasMap`
(`src/components/ocorrencias/OcorrenciaMap.tsx`) já sabe renderizar
`o.latitude`/`o.longitude`, mas nada no app **produz** essas coordenadas — elas
só existem se o backend as gerar de outra forma.
**Correção:** capturar `latitude`/`longitude` (+ timestamp) no momento de
`salvarImovel` (`useVisitas.ts:205`) e no submit de nova ocorrência, e
enviá-las no payload.
**Esforço:** médio (~4-6h incluindo tratamento de permissão negada/GPS
desligado).

### 🟠 ALTA — `app.json` não declara permissões de localização
Não há `ios.infoPlist.NSLocationWhenInUseUsageDescription` nem bloco de
`android.permissions`. Sem a descrição do iOS, qualquer chamada futura a
`requestForegroundPermissionsAsync` vai falhar silenciosamente/crashar em
build de produção iOS (o prompt do sistema não aparece sem a string).
**Correção:** adicionar o plugin `expo-location` com `locationAlwaysAndWhenInUsePermission`/`NSLocationWhenInUseUsageDescription` customizada e testável em pt-BR.
**Esforço:** trivial (~30min), mas bloqueante para o item acima.

### 🟢 Isolamento por cidade / raio de atuação
Não há lógica cliente-side de raio de 30km em lugar nenhum — o que é
**esperado e correto** aqui, já que o próprio contexto do usuário diz que o
backend tem `CidadeScope`. Validar isso no cliente seria redundante e
falsificável (não confiar em client-side para regra de negócio). O único gap
real é: se o backend rejeitar uma ação por estar fora do raio, o app trata
isso como um erro genérico de API (nenhum tratamento especial visto em
`useVisitas.ts` para esse caso) — vale um teste manual depois que a captura de
geo existir.

---

## 3. Integração com backend / completude funcional

### 🔴 CRÍTICO — "Nova Ocorrência" não chama a API
`src/features/ocorrencias/nova.tsx:105-127`. `handleSubmit` faz
`await new Promise((resolve) => setTimeout(resolve, 1500))` e mostra
"Sucesso" — há um comentário `// TODO: integrar com a API (POST /ocorrencias)`
no próprio código. **Nenhuma ocorrência criada nessa tela é persistida.** Isso
é o tipo de bug que passa despercebido em teste manual porque a UI "funciona"
(mostra loading, sucesso, volta pra tela anterior) sem nunca ter tocado o
backend.
**Correção:** substituir pelo POST real (`api.post("/ocorrencias", payload)`),
incluir lat/long capturados (item anterior) e, idealmente, foto.
**Esforço:** pequeno-médio (~3h, mais se incluir foto).

### 🟠 ALTA — Estatísticas do Perfil são números fixos falsos
`src/features/perfil/index.tsx:96-109` mostra "127 Visitas / 45 Ocorrências /
98% Aprovação" **hardcoded**, com comentário `// TODO: buscar da API quando o
endpoint existir`. Isso é enganoso para o agente (parece dado real). Se o
endpoint ainda não existe no backend, a tela deveria pelo menos omitir o card
em vez de mostrar números inventados.
**Correção:** esconder o card de estatísticas até existir endpoint real, ou
computar visitas/ocorrências reais a partir dos dados já buscados no
dashboard/ocorrências (parcialmente possível sem endpoint novo).
**Esforço:** pequeno (~1-2h para versão computada a partir de dados já
disponíveis).

### 🟡 MÉDIA — Menu do Perfil é majoritariamente placeholder
"Dados pessoais", "Notificações", "Segurança", "Termos", "Ajuda" chamam todos
a mesma função `emBreve()` (`Alert.alert("Em breve", ...)`). Não há tela de
"alterar senha" nem toggle de modo offline/online nem botão de "Sincronizar
agora" no Perfil (o sync existe, mas só é acionável de dentro do fluxo de
visitas via `sincronizar()` em `useVisitas.ts`).
**Correção:** priorizar "Sincronizar agora" + contador de pendentes no Perfil
(dado que a lógica já existe em `sync.ts`/`totalPendentes()`) e "Alterar
senha" (se o backend tiver endpoint). O resto pode continuar "em breve" por
mais um ciclo.
**Esforço:** pequeno (~2h) para sync + contador.

### 🟡 MÉDIA — Sem tela de Relatórios
Nada no código referencia relatórios assíncronos (`/relatorios`, status,
download), apesar do backend já suportar isso segundo o contexto fornecido.
Não há service, hook, nem tela.
**Esforço:** médio-grande — é a maior peça de funcionalidade nova genuína (ver
seção 5).

### 🟡 MÉDIA — Sem central de notificações
`expo-notifications` está instalado mas sem nenhum uso (nenhum
`registerForPushNotificationsAsync`, nenhum listener). O item "Notificações"
do Perfil mostra "Ativadas" como texto fixo, o que é enganoso — nada está de
fato registrado.
**Esforço:** médio (~1 dia para push registration + tela de central básica).

---

## 4. Arquitetura

No geral, a arquitetura é **boa e mais madura do que o briefing genérico
supõe**:

- Separação clara `app/` (rotas Expo Router, finas) → `src/features/*`
  (orquestração de tela) → `src/hooks/*` (máquinas de estado) →
  `src/services/*` (chamadas HTTP) → `src/types/*` + `src/mappers/*`. Isso é
  essencialmente MVP/Presenter já aplicado, sem precisar reestruturar nada.
- `useVisitas.ts` é um exemplo sólido de state machine explícita por hook —
  fácil de auditar, cada transição de step é uma função isolada.
- Offline-first parcial e bem desenhado: fila `outbox` em SQLite
  (`src/db/outbox.ts`) com `client_uuid` para idempotência, processada por
  `sync.ts`. A decisão de **não** permitir abrir/fechar sessão ou encerrar
  quadra offline (documentada em `docs/FLUXO.md:79-83`) é uma escolha de
  design correta, não uma lacuna — evita conflito de estado distribuído. Só
  registro de imóvel é offline-capaz hoje; isso é rotulado "fase 1" no próprio
  doc do projeto.
- **Duplicação pequena:** existem dois componentes `AreaCard` diferentes
  (`src/features/areas/components/AreaCard.tsx` e
  `src/features/visitas/components/AreaCard.tsx`), usados por telas
  diferentes (aba Áreas vs. fluxo de Visitas). Pode ser intencional
  (props/visual diferentes), mas vale confirmar se não é drift acidental.
- **Zero testes** no projeto — nem unitário nem de integração, nenhuma
  configuração de Jest em `package.json`. Dado que já existem várias máquinas
  de estado não-triviais (`useVisitas.ts`, `sync.ts`), isso é o maior risco de
  regressão silenciosa a médio prazo.

---

## 5. Performance

Nada crítico encontrado. Expo Router já faz code-splitting de rota por
padrão. Não há uso pesado de imagens além dos ícones padrão do template Expo
(ainda não substituídos por assets reais do projeto — `react-logo.png` etc.
seguem no repo, provavelmente lixo do template inicial).

---

## Resumo priorizado (para decidir o próximo passo)

| # | Item | Severidade | Esforço | Área |
|---|---|---|---|---|
| 1 | Token em AsyncStorage → SecureStore | 🔴 Crítico | Pequeno | Segurança |
| 2 | Geolocalização não capturada em nenhum registro | 🔴 Crítico | Médio | Geo |
| 3 | "Nova Ocorrência" não persiste (mock) | 🔴 Crítico | Pequeno-médio | Integração |
| 4 | Sem renovação automática de token | 🟠 Alta | Médio | Segurança |
| 5 | Sem logout por inatividade | 🟠 Alta | Pequeno | Segurança |
| 6 | `app.json` sem permissão de localização | 🟠 Alta | Trivial | Geo |
| 7 | Estatísticas do Perfil são falsas | 🟠 Alta | Pequeno | Integração |
| 8 | Guarda de rota só na raiz | 🟡 Média | Pequeno | Segurança |
| 9 | Base URL hardcoded / HTTP | 🟡 Média | Pequeno | Segurança |
| 10 | Menu Perfil todo placeholder | 🟡 Média | Pequeno (parcial) | Integração |
| 11 | Sem tela de Relatórios | 🟡 Média | Médio-grande | Feature nova |
| 12 | Sem central de notificações | 🟡 Média | Médio | Feature nova |
| 13 | Zero testes | 🟡 Média | — (contínuo) | Arquitetura |
| 14 | `AreaCard` duplicado | 🟢 Baixa | Trivial | Arquitetura |
| 15 | Biometria | 🟢 Baixa | Médio | Segurança (opcional) |

Itens 1, 4, 5, 6, 8, 9 são todos pequenos e de segurança — dá pra resolver
juntos como um único "pacote de hardening" sem precisar de brainstorm
individual por item. Itens 2 e 3 são acoplados (captura de geo é pré-requisito
pra ocorrência ter coordenadas reais) e formam o núcleo funcional que faltava.
Itens 11 e 12 são as únicas peças que se parecem com "tela nova do zero" no
sentido do briefing original.
