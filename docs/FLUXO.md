# Fluxo de trabalho do agente de endemias

## Os 3 conceitos (não misturar!)

A maior fonte de confusão no fluxo era usar "visita" para tudo. São **três coisas diferentes**:

| Conceito | O que é | Ciclo de vida |
|---|---|---|
| **Quadra no tratamento** | O quarteirão dentro do ciclo (1 a 6 do ano) | `nao_iniciada → em_andamento → concluida` (irreversível) |
| **Visita (sessão do dia)** | Um período de trabalho do agente numa quadra | `aberta → fechada`. Pode haver **várias** por quadra/tratamento (uma por dia ou por período manhã/tarde) |
| **Registro de imóvel** | Uma casa visitada dentro de uma sessão | Situação: `N` (normal), `R` (recusa), `F` (fechado), `REC` (recuperado) |

## Regras de negócio

1. **Iniciar dia**: abre uma sessão (`Visita`) na quadra. Se a quadra está `nao_iniciada`, passa a `em_andamento`.
2. **Almoço / fim do expediente**: agente **encerra as visitas do dia** → fecha a sessão. A quadra **continua `em_andamento`**. Nada é perdido.
3. **Dia seguinte (ou tarde)**: agente seleciona a mesma quadra → app detecta status `em_andamento` → oferece **"Retomar quarteirão"** → abre **nova sessão**. Os imóveis já registrados aparecem na lista (vêm da quadra, não da sessão).
4. **Encerrar quarteirão**: só quando terminou todas as casas. Fecha a sessão aberta **e** marca a quadra como `concluida`. **Definitivo — não reabre.**
5. **Mais de um quarteirão por dia**: ao encerrar um quarteirão, o agente volta à lista de quadras e inicia o próximo (nova sessão).
6. **Recuperação**: imóveis com situação `F` (fechado) ficam numa lista de pendências do tratamento, **mesmo com a quadra concluída**. O agente acessa a tela de Recuperação, revisita a casa e registra o resultado: `REC` (conseguiu atender), `R` (recusou) ou `F` de novo (continua fechado).

## Máquina de estados da quadra

```
nao_iniciada --[iniciar dia]--> em_andamento
em_andamento --[encerrar dia]--> em_andamento   (sessão fecha, quadra continua)
em_andamento --[encerrar quarteirão]--> concluida  (DEFINITIVO)
concluida    --[recuperação de imóvel F]--> concluida (só registros REC, não reabre)
```

## Mapa de telas (feature `visitas`)

```
TelaAreas                → escolhe a área
  └─ TelaQuadras         → lista quadras com status; concluída → só recuperação
       └─ TelaIniciarVisita → confirma:
            • "Iniciar visitas do dia"   (quadra não iniciada)
            • "Continuar visita"         (sessão ainda aberta — ex.: fechou o app)
            • "Retomar quarteirão"       (quadra em andamento, sessão de ontem fechada)
            └─ TelaVisitaAberta  → lista imóveis registrados + resumo
                 • [Registrar imóvel]      → TelaFormImovel
                 • [Encerrar visitas do dia] → volta p/ TelaQuadras (quadra em andamento)
                 • [Encerrar quarteirão]     → confirmação (mostra nº de fechados) → TelaQuadras

TelaRecuperacao (rota própria: /visitas/recuperacao)
  → lista imóveis F do tratamento atual (todas as quadras, inclusive concluídas)
  → toca no imóvel → registra resultado (REC / R / F)
```

## Estrutura de pastas

```
app/(app)/visitas/
  index.tsx            # fluxo principal (steps controlados pelo hook)
  recuperacao.tsx      # rota da recuperação (independente do fluxo)

src/
  features/visitas/
    index.tsx          # orquestra os steps
    context/VisitasContext.tsx
    screens/           # TelaAreas, TelaQuadras, TelaIniciarVisita,
                       # TelaVisitaAberta, TelaFormImovel, TelaRecuperacao
    components/        # PageHeader, Banners, StatusPill, EmptyState
  hooks/
    useVisitas.ts      # máquina de estados do fluxo
    useRecuperacao.ts  # lista/registro de recuperações
  services/
    visitaService.ts   # chamadas de API do fluxo
    recuperacaoService.ts
    sync.ts            # processa fila offline
  db/
    database.ts        # SQLite local (expo-sqlite)
    outbox.ts          # fila de ações pendentes de sincronização
  types/               # visita, quadra, imovel, tratamento, area...
```

## Offline (fase 1)

O registro de imóvel é a ação mais frequente em campo e a mais sujeita a falta de sinal:

- Toda ação de **registrar imóvel** que falhar por falta de rede entra na **outbox** (SQLite) e aparece na lista com selo "pendente de sincronização".
- `sync.ts` reprocessa a fila quando o app abre ou quando o agente toca em "Sincronizar".
- **Abrir sessão, encerrar dia e encerrar quarteirão ainda exigem conexão** nesta fase (evita conflito de estado com o servidor). Fase 2: espelhar quadras/sessões no SQLite e sincronizar tudo.
