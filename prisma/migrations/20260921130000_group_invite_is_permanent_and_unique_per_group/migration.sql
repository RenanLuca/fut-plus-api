-- Convites passam a ser permanentes (sem expiração) e há no máximo um por grupo.
-- Nenhum fluxo criava convites até aqui; limpar garante que o índice único não falhe.
DELETE FROM "group_invites";

-- AlterTable
ALTER TABLE "group_invites" DROP COLUMN "expires_at";

-- CreateIndex
CREATE UNIQUE INDEX "group_invites_groupId_key" ON "group_invites"("groupId");
