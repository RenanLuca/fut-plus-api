import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { UsersRepository } from "./repositories/users.repository";
import { GuestUsersRepository } from "./repositories/guest-users.repository";
import { GroupMembersRepository } from "./repositories/group-members.repository";
import { GroupsRepository } from "./repositories/groups.repository";
import { GroupMatchesRepository } from "./repositories/group-matches.repository";
import { MatchPresencesRepository } from "./repositories/match-presences.repository";
import { MatchTeamsRepository } from "./repositories/match-teams.repository";
import { MatchTeamsPlayersRepository } from "./repositories/match-team-players.repository";
import { GroupPaymentsRepository } from "./repositories/group-payments.repository";
import { GroupInvitesRepository } from "./repositories/group-invites.repository";
import { VerificationTokensRepository } from "./repositories/verification-tokens.repository";

@Global()
@Module({
  providers: [
    PrismaService,
    UsersRepository,
    GuestUsersRepository,
    GroupMembersRepository,
    GroupsRepository,
    GroupMatchesRepository,
    MatchPresencesRepository,
    MatchTeamsRepository,
    MatchTeamsPlayersRepository,
    GroupPaymentsRepository,
    GroupInvitesRepository,
    VerificationTokensRepository,
  ],
  exports: [
    UsersRepository,
    GuestUsersRepository,
    GroupMembersRepository,
    GroupsRepository,
    GroupMatchesRepository,
    MatchPresencesRepository,
    MatchTeamsRepository,
    MatchTeamsPlayersRepository,
    GroupPaymentsRepository,
    GroupInvitesRepository,
    VerificationTokensRepository,
  ],
})
export class DatabaseModule {}
