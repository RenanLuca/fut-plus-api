# Modelo de domínio

Ver `prisma/schema.prisma` para os campos exatos — isto aqui é o
"porquê" por trás do shape das tabelas, não um substituto do schema.

## Dual-membership: usuário registrado XOR convidado

Um `Group` tem `GroupMember`s que são **ou** um `User` registrado **ou**
um `GuestUser` (convidado sem conta) — nunca os dois, nunca nenhum.
`userId` e `guestUserId` são FKs nullable no mesmo registro; exatamente
um dos dois é preenchido.

Esse mesmo padrão se repete em `GroupMember`, `GroupMatchPresence` e
`MatchTeamPlayer`. Qualquer service/repository que lida com participante
de partida (presença, escalação em time) precisa tratar os dois casos —
nunca assume que `userId` existe. Ao adicionar uma feature nova que toca
participante, verifica explicitamente se o service já existente cobre
ambos os casos antes de copiar um trecho que só lida com `User`.

## Estrutura de partida

`GroupMatch` (recorrente: semanal, `EVENTUAL` ou `MONTHLY`) tem
`GroupMatchPresence` (quem confirmou presença) e pode ser dividida em
`MatchTeam`s, cada um com `MatchTeamPlayer`s. `GroupPayment` cobre
mensalidade por usuário/período, opcionalmente vinculada a uma partida
específica.

## Lógica de negócio não-óbvia (ler antes de mexer)

- `src/modules/group-matches/services/group-matches-scheduler.service.ts`
  — cron de meia-noite (timezone `America/Sao_Paulo`, via
  `src/shared/utils/brazil-date.ts`) que gera automaticamente a próxima
  partida de todo grupo `MONTHLY` cujo dia da semana cai N dias à frente.
  Qualquer mudança em frequência de partida ou geração automática passa
  por aqui.
- `src/modules/match-teams/utils/match-teams-balancer.ts` — balanceia
  jogadores confirmados em times agrupando por `Position` e fazendo
  snake-draft por peso de `Rank`, pra evitar que jogadores fortes se
  empilhem num time só. Mudança em critério de balanceamento (novo peso,
  novo critério de agrupamento) é decisão de produto, não só técnica —
  confirma com o usuário antes de alterar o critério, não só a
  implementação.
