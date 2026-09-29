import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { UsersRepository } from "./repositories/users.repository";
import { GuestUsersRepository } from "./repositories/guest-users.repository";
import { GroupMembersRepository } from "./repositories/group-members.repository";
import { GroupsRepository } from "./repositories/groups.repository";
import { GROUPS_REPOSITORY } from "./interfaces/groups.repository.interface";
import { GROUP_MEMBERS_REPOSITORY } from "./interfaces/group-members.repository.interface";
import { GROUP_INVITES_REPOSITORY } from "./interfaces/group-invites.repository.interface";
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
    { provide: GROUP_MEMBERS_REPOSITORY, useClass: GroupMembersRepository },
    { provide: GROUPS_REPOSITORY, useClass: GroupsRepository },
    GroupMatchesRepository,
    MatchPresencesRepository,
    MatchTeamsRepository,
    MatchTeamsPlayersRepository,
    GroupPaymentsRepository,
    { provide: GROUP_INVITES_REPOSITORY, useClass: GroupInvitesRepository },
    VerificationTokensRepository,
  ],
  exports: [
    UsersRepository,
    GuestUsersRepository,
    GROUP_MEMBERS_REPOSITORY,
    GROUPS_REPOSITORY,
    GroupMatchesRepository,
    MatchPresencesRepository,
    MatchTeamsRepository,
    MatchTeamsPlayersRepository,
    GroupPaymentsRepository,
    GROUP_INVITES_REPOSITORY,
    VerificationTokensRepository,
  ],
})
export class DatabaseModule {}
