# Nomenclatura e estrutura de pasta

## Onde cada tipo de arquivo mora

| Tipo | Local |
|---|---|
| Módulo de feature | `src/modules/<feature>/` |
| Controller | `src/modules/<feature>/<feature>.controller.ts` |
| Module (wiring) | `src/modules/<feature>/<feature>.module.ts` |
| Service (módulo com 1 responsabilidade) | `src/modules/<feature>/<feature>.service.ts` |
| Service (módulo com mais de 1 responsabilidade) | `src/modules/<feature>/services/<nome>.service.ts` |
| DTO de request | `src/modules/<feature>/dto/<nome>.dto.ts` |
| Guard específico do módulo | `src/modules/<feature>/guards/<nome>.guard.ts` |
| Constante específica do módulo | `src/modules/<feature>/constants/<nome>.ts` |
| Util puro específico do módulo | `src/modules/<feature>/utils/<nome>.ts` |
| Repository (acesso a dado) | `src/shared/database/repositories/<model-em-kebab-case>.repository.ts` |
| Decorator compartilhado | `src/shared/decorators/<Nome>.ts` |
| Util compartilhado entre módulos | `src/shared/utils/<nome>.ts` |
| Config de ambiente | `src/shared/config/` |

## Nomenclatura de arquivo

- Módulo/controller/service: `<feature-em-kebab-case>.<papel>.ts`
  (ex: `group-matches.controller.ts`, `group-matches.service.ts`)
- Repository: nome do model do Prisma em kebab-case, plural quando o model
  já é referenciado no plural no domínio (ex: `groups.repository.ts`,
  `match-teams.repository.ts`)
- Guard: `<nome-em-kebab-case>.guard.ts` (ex: `group-owner.guard.ts`)
- DTO: confirmar o padrão já em uso na pasta `dto/` do módulo antes de
  criar um novo — o projeto tem os dois estilos em uso
  (`create-group.dto.ts` em kebab-case e `updateUser.dto.ts` em
  camelCase) sem uma convenção única resolvida ainda. Não inventa um
  terceiro estilo; segue o que já existe *naquele módulo* especificamente.
- Decorator: `PascalCase.ts`, nome igual ao decorator exportado
  (ex: `ActiveUserId.ts` exporta `@ActiveUserId()`)

## Repository: um por model, método recebe `*Args` do Prisma

Um repository nunca expõe um método com filtros ad-hoc (`findByGroupId`,
`findActiveUsers`) quando o mesmo resultado é alcançável passando um
`Prisma.<Model>FindManyArgs` pronto. Ver `architecture.md` para o porquê.

## Import

`@src/*` aponta para `src/*` (`tsconfig.json`). Usa o alias para qualquer
import fora do módulo atual — caminho relativo só entre arquivos do mesmo
módulo (ex: de dentro de `services/` para o `.controller.ts` do mesmo
módulo).
