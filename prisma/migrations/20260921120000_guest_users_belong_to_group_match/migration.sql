-- Guests now belong to a single match instead of the group.
-- Existing guests have no originating match, so they are deleted; rows that
-- depend on them (GUEST group members, presences and team players) go with
-- them through ON DELETE CASCADE.
DELETE FROM "guest_users";

-- AlterEnum
BEGIN;
CREATE TYPE "GroupMemberType_new" AS ENUM ('MONTHLY', 'DAILY', 'OWNER');
ALTER TABLE "group_members" ALTER COLUMN "type" TYPE "GroupMemberType_new" USING ("type"::text::"GroupMemberType_new");
ALTER TYPE "GroupMemberType" RENAME TO "GroupMemberType_old";
ALTER TYPE "GroupMemberType_new" RENAME TO "GroupMemberType";
DROP TYPE "GroupMemberType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "group_members" DROP CONSTRAINT "group_members_guest_user_id_fkey";

-- DropForeignKey
ALTER TABLE "group_members" DROP CONSTRAINT "group_members_user_id_fkey";

-- DropIndex
DROP INDEX "group_members_group_id_guest_user_id_key";

-- AlterTable
ALTER TABLE "guest_users" ADD COLUMN     "group_match_id" TEXT NOT NULL,
ADD COLUMN     "rank" "Rank" NOT NULL;

-- AlterTable
ALTER TABLE "group_members" DROP COLUMN "guest_user_id",
ALTER COLUMN "user_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "guest_users" ADD CONSTRAINT "guest_users_group_match_id_fkey" FOREIGN KEY ("group_match_id") REFERENCES "group_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
