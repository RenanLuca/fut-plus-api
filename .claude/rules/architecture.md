# Arquitetura — camadas NestJS

## Princípio central

Toda feature vive em `src/modules/<feature>/` com quatro papéis fixos, e
nenhum deles faz o trabalho do outro:

- `*.controller.ts` — rotas HTTP, shape de request/response. Nunca contém
  regra de negócio nem acessa o Prisma diretamente.
- `*.service.ts` (ou `services/*.service.ts` quando o módulo tem mais de
  um, ver seção abaixo) — regra de negócio, orquestra repositories.
- `dto/*.dto.ts` — DTOs de request com `class-validator`/`class-transformer`.
- `*.module.ts` — conecta controller, services e guards do módulo.

## Regra dura: nunca chamar o Prisma direto de um service

Todo acesso a dado passa por `src/shared/database/repositories/`, um
repository por model do Prisma, injetado via `DatabaseModule` (`@Global()`).
Um `*.service.ts` nunca importa `PrismaClient` nem `PrismaService`
diretamente — sempre injeta o repository correspondente.

Métodos de repository recebem os `*Args` nativos do Prisma como parâmetro
(ex: `Prisma.GroupFindManyArgs`), não um DTO de filtro inventado à mão:

```ts
// groups.repository.ts
findMany(args: Prisma.GroupFindManyArgs) {
  return this.prisma.group.findMany(args);
}
```

Se uma query precisa de uma forma nova, ela entra como um novo método (ou
um novo `args` montado no service) — não vira uma abstração de filtro
paralela ao que o Prisma já oferece.

## Um service por arquivo, services/ só quando há mais de um

Módulo com uma responsabilidade central (ex: `auth`, `users`,
`match-teams`) mantém um único `<feature>.service.ts` solto na raiz do
módulo. Módulo que acumulou uma segunda responsabilidade genuinamente
separada (ex: `groups` tem `groups.service.ts` e
`userBelongsToGroup.service.ts`; `group-matches` tem
`group-matches.service.ts` e `group-matches-scheduler.service.ts` para o
cron) move todos os services para `services/` e mantém um arquivo por
responsabilidade.

Não quebra um service em vários arquivos só por tamanho — a divisão é por
responsabilidade (ex: lógica principal vs. um cron separado), nunca por
"esse arquivo está grande".

## Autenticação e autorização

`AuthGuard` (`src/modules/auth/auth.guard.ts`) é global via `APP_GUARD` —
toda rota exige um JWT bearer válido por padrão. Uma rota pública usa o
decorator `@IsPublic()` (`src/shared/decorators/IsPublic.ts`) explicitamente,
nunca remove o guard do módulo.

Dentro de um handler, o id do usuário autenticado vem de `@ActiveUserId()`
(`src/shared/decorators/ActiveUserId.ts`), que lê `request.userId` (setado
pelo guard a partir do claim `sub` do JWT) — nunca lê o token ou decodifica
o JWT de novo dentro do controller/service.

Rotas que agem sobre um grupo específico usam também `GroupOwnerGuard`
(`src/modules/groups/guards/group-owner.guard.ts`), que confere
`request.params.groupId` contra `request.userId`. Uma rota nova que muda
dado de um grupo (não só lê) precisa desse guard — não reimplementa a
checagem de ownership dentro do service.

## Path alias

`@src/*` aponta para `src/*` (`tsconfig.json`). Usa o alias para qualquer
import fora do módulo atual, caminho relativo só entre arquivos do mesmo
módulo.
