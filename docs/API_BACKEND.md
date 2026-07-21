# Endpoints necessários no Laravel

> **Status: IMPLEMENTADO** em 13/07/2026 (projeto `vigilancia-geo-backend`).
> Rodar `php artisan migrate` — foram adicionadas 2 migrations:
> `origem` em `visitas` e `client_uuid` em `imoveis`.

## Já existem (manter)

| Método | Rota | Uso no app |
|---|---|---|
| GET | `/visitas?quadra_id&tratamento_id` | detectar sessão aberta ao selecionar quadra |
| POST | `/visitas` `{quadra_id, tratamento_id}` | abrir sessão do dia |
| POST | `/visitas/{id}/imoveis` | registrar imóvel na sessão |
| PATCH | `/visitas/{id}/fechar` | encerrar visitas do dia |
| PATCH | `/quadras/{id}/status` `{status: "concluida"}` | encerrar quarteirão |
| POST | `/imoveis` | cadastrar imóvel novo na quadra |
| GET | `/imoveis/quadra/{quadraId}` | listar imóveis já registrados da quadra |

## Novos (implementar)

### 1. Listar imóveis fechados do tratamento (recuperação)

```
GET /tratamentos/{tratamentoId}/imoveis-fechados
```

Retorna imóveis cuja **última** situação no tratamento é `F`, de todas as quadras do agente (inclusive quadras `concluida`). Incluir: imóvel, quadra (número), área, data/hora da última tentativa e nº de tentativas.

```json
{ "data": [ {
  "imovel": { "id": 12, "endereco_completo": "Rua A, 10", "tipo_imovel": {...} },
  "quadra": { "id": 3, "numero": 3, "status": "concluida" },
  "area":   { "id": 1, "nome": "Área 04" },
  "ultima_tentativa": "2026-07-10T09:32:00Z",
  "tentativas": 2
} ] }
```

### 2. Registrar recuperação

```
POST /imoveis/{imovelId}/recuperacao
{
  "tratamento_id": 2,
  "situacao": "REC" | "R" | "F",
  "horario_visita": "14:35",
  "focos_eliminados": 0,
  "tratado": true,
  "quantidade_larvicida": 2.5,
  "depositos_tratados": 3
}
```

Cria novo registro de visita ao imóvel **sem exigir sessão aberta nem quadra em andamento** (a quadra pode estar `concluida`). Se `situacao = "F"`, o imóvel continua na lista de fechados; se `REC` ou `R`, sai.

## Regras para validar no servidor (não confiar só no app)

1. `PATCH /quadras/{id}/status` para `concluida` é **irreversível** — rejeitar tentativa de reabrir.
2. `POST /visitas` deve rejeitar quadra `concluida` (409).
3. `POST /visitas` com sessão já aberta na mesma quadra/tratamento/agente: retornar a sessão existente (idempotente) em vez de erro.
4. `POST /visitas/{id}/imoveis` deve aceitar **client_uuid** opcional e ignorar duplicatas (idempotência p/ sincronização offline — o app pode reenviar após queda de rede).
5. Encerrar quarteirão **não** deve exigir zero imóveis fechados — os `F` vão para a recuperação.
