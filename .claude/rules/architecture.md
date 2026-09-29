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

## Repositories atrás de interface (Dependency Inversion)

Repository migrado para DIP tem uma interface em
`src/shared/database/interfaces/<model>.repository.interface.ts`, que
exporta três coisas: o tipo de domínio do model, a interface
`I<Model>Repository` e o token de injeção (`Symbol`, ex:
`GROUPS_REPOSITORY`). A interface não importa nada do Prisma — só tipos de
domínio e enums de `src/shared/enum/`.

A classe do repository faz `implements I<Model>Repository` e é a única que
conhece o Prisma, incluindo o mapeamento do retorno do Prisma para o tipo
de domínio. O `DatabaseModule` registra
`{ provide: GROUPS_REPOSITORY, useClass: GroupsRepository }` e exporta o
token. O service injeta com `@Inject(GROUPS_REPOSITORY)` e tipa com
`import type { IGroupsRepository }` (`import type` é obrigatório por causa
de `isolatedModules` + `emitDecoratorMetadata`).

### Quando um service (não-repository) também ganha interface

O mesmo padrão (interface + `Symbol` + `@Inject`) se aplica a um service
que fala direto com uma infraestrutura externa — hoje só o `MailService`
(`src/modules/mail/interfaces/mail.service.interface.ts`, token
`MAIL_SERVICE`), que chama a API do Resend. A pasta `interfaces/` fica
dentro do próprio módulo de feature, não em `src/shared/`, porque o
service não é compartilhado entre models como um repository.

Um service que só orquestra *outros services* da aplicação (ex:
`GroupsService`, `UserBelongsToGroupService`, `VerificationTokensService`)
**não** precisa desse padrão: é uma classe concreta normal, injetada sem
token. Diferente de uma interface, uma classe não desaparece na compilação
— o Nest resolve pelo tipo, e um teste troca a implementação com
`{ provide: NomeDoService, useValue: mock }` sem precisar de token nem
interface no meio. Dar interface a esses services não muda a capacidade de
teste, só adiciona uma camada sem necessidade.

Os métodos da interface são nomeados pela intenção (`findById`,
`findAllByMember`), não recebem `Prisma.*Args`. Repositories que ainda não
foram migrados continuam recebendo `Prisma.*Args` (ex:
`Prisma.GroupFindManyArgs`) — a migração é feita um model por vez.

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
