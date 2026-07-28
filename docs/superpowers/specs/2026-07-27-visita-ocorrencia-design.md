# Visita/Atendimento de Ocorrência — SISVA Mobile

Data: 2026-07-27
Repos envolvidos: `vigilancia-mobile` (mobile) e `vigilancia-geo-backend` (API).

## Problema

A tela de detalhes de uma ocorrência (`app/(app)/ocorrencias/[id].tsx`) só exibe
dados — não há como o agente registrar o atendimento em campo nem marcar a
ocorrência como resolvida. `PATCH /ocorrencias/{id}/status` já existe no
backend, mas (a) não tem UI no mobile e (b) a role `agente` não tem a
permission `RESOLVER_OCORRENCIA` no seeder — bateria 403 mesmo se tivesse UI.

## Fluxo aprovado

1. Detalhes da ocorrência (`status !== resolvido`) mostra o botão **"Iniciar
   visita da ocorrência"**.
2. Abre a tela `ocorrencias/atender.tsx?id={ocorrenciaId}` com o formulário:
   nome do morador (opcional), telefone de contato (opcional), endereço
   (pré-preenchido do registro da ocorrência, editável), situação encontrada
   (chips: Confirmado / Não encontrado / Falso alarme / Encaminhado a outro
   setor), descrição do atendimento, fotos (mínimo 1, câmera ou galeria).
   GPS capturado na hora, igual ao resto do app.
3. Botão final **"Marcar ocorrência como resolvida"** abre um modal de
   confirmação com o resumo dos dados + miniatura das fotos.
4. Confirmar envia tudo numa única chamada. Sucesso → volta pra tela de
   detalhes, que agora mostra o atendimento salvo (read-only) no lugar do
   botão — a ocorrência está com `status = resolvido`.

## Backend

### Migration — tabela `ocorrencia_atendimentos`

Um atendimento por ocorrência (aplicação garante isso verificando
`status !== resolvido` antes de permitir o POST; sem unique constraint pra não
impedir reprocessamento manual futuro via admin).

```
id
ocorrencia_id    (FK ocorrencias, cascade on delete)
agente_id        (FK agentes)
nome_morador     nullable string
telefone_contato nullable string
endereco_confirmado string
situacao_encontrada enum: confirmado | nao_encontrado | falso_alarme | encaminhado
descricao        text nullable
fotos            json  (array de paths, mesmo padrão de `imoveis.fotos`)
latitude, longitude float nullable
created_at, updated_at
```

Sem tabela de foto separada — path array direto na linha, replicando o
padrão já usado em `imoveis.fotos` (não `visita_fotos` — essa tabela não
existe; upload de foto de visita hoje só grava em disco e devolve
`{path,url}`, é o chamador quem agrega no array).

### Model `OcorrenciaAtendimento`

`belongsTo(Ocorrencia::class)`, `belongsTo(Agente::class)`. Sem lógica de
negócio além disso — a validação de "só posso atender minha ocorrência" fica
na Policy, e "já tem atendimento" fica implícito no `status`.

### Endpoint

`POST /ocorrencias/{ocorrencia}/atendimento`, multipart, campos acima +
`fotos[]` (múltiplos arquivos, `image|max:8192` cada, `min:1`). Dentro de uma
`DB::transaction`: cria o `OcorrenciaAtendimento`, sobe as fotos pro disco
(`ocorrencias/{id}/atendimento`, disco `public`, mesmo padrão de
`visitas/{id}`), grava os paths no registro, e chama
`$ocorrencia->atualizarStatus('resolvido')`. Se qualquer etapa falhar, a
transação desfaz tudo — nunca fica em estado parcial (atendimento sem status
atualizado, ou vice-versa).

Adicionar em `OcorrenciaController`: `atender(AtenderOcorrenciaRequest $request, Ocorrencia $ocorrencia)`.
Adicionar em `IOcorrenciaService`/`OcorrenciaService`: `atender(Ocorrencia $ocorrencia, array $dados, array $fotos): OcorrenciaAtendimento`.

Rota: `Route::post('/{ocorrencia}/atendimento', 'atender')->can('resolver', 'ocorrencia')`
dentro do grupo `ocorrencias` já existente em `routes/api.php`.

### Policy — aperta `resolver`

`OcorrenciaPolicy::resolver` hoje só checa a permission, sem checar dono —
qualquer agente com `RESOLVER_OCORRENCIA` poderia resolver ocorrência de
outro agente. Ajustar para:

```php
public function resolver(User $user, Ocorrencia $ocorrencia): Response
{
    if (!$user->hasPermissionTo(PermissionEnum::RESOLVER_OCORRENCIA)) {
        return Response::deny('Sem permissão para resolver ocorrências.');
    }

    // Agente só resolve a própria ocorrência; admin/coordenador (via before())
    // já passa direto por essa checagem.
    if ($ocorrencia->agente_id !== null && $ocorrencia->agente_id !== $user->agente?->id) {
        return Response::deny('Esta ocorrência não está atribuída a você.');
    }

    return Response::allow();
}
```

### Permission seeder

Adicionar `PermissionEnum::RESOLVER_OCORRENCIA` na lista `syncPermissions` da
role `agente` em `PermissionSeeder.php` (mesmo padrão do ajuste já feito para
`relatorio-agente-view`). Precisa rodar `php artisan db:seed --class=PermissionSeeder`
depois (mesma limitação de ambiente da vez anterior — SSL/cafile — então só
edito o código, você roda o seeder).

## Mobile

### Tipos e service

`src/types/ocorrenciaAtendimento.ts` novo: `SituacaoEncontrada`, `OcorrenciaAtendimento`.
`src/services/ocorrenciaService.ts` ganha `atender(ocorrenciaId, payload, fotos)`.

### Outbox / offline

Novo `OutboxTipo`: `atender_ocorrencia`. Payload guarda os campos do
formulário + URIs locais das fotos (`fotos: string[]`, URIs do
`expo-image-picker`). `sync.ts` ganha um case que monta o `FormData` com os
arquivos reais (lidos do URI local via `expo-file-system`) e faz o POST
único — mais simples que `registrar_imovel` porque não tem passo
intermediário de criar recurso pai.

### Telas

- `src/features/ocorrencias/detalhes.tsx`: botão novo (`status !== 'resolvido'`)
  navegando pra `ocorrencias/atender?id=`. Quando resolvida, busca e exibe o
  atendimento salvo em vez do botão.
- `app/(app)/ocorrencias/atender.tsx` (rota flat, mesmo padrão de `nova.tsx`)
  + `src/features/ocorrencias/atender.tsx` (implementação): formulário
  descrito no fluxo acima, com o modal de confirmação antes do envio final.

## Fora de escopo agora

- Editar/excluir um atendimento já enviado.
- Múltiplos atendimentos por ocorrência (reabrir depois de resolvida).
- Notificar alguém quando uma ocorrência é resolvida.
