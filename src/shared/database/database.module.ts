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
import { USERS_REPOSITORY } from "./interfaces/users.repository.interface";
import { GUEST_USERS_REPOSITORY } from "./interfaces/guest-users.repository.interface";
import { GROUP_MATCHES_REPOSITORY } from "./interfaces/group-matches.repository.interface";
import { MATCH_PRESENCES_REPOSITORY } from "./interfaces/match-presences.repository.interface";
import { MATCH_TEAMS_REPOSITORY } from "./interfaces/match-teams.repository.interface";
import { MATCH_TEAM_PLAYERS_REPOSITORY } from "./interfaces/match-team-players.repository.interface";
import { GROUP_PAYMENTS_REPOSITORY } from "./interfaces/group-payments.repository.interface";
import { VERIFICATION_TOKENS_REPOSITORY } from "./interfaces/verification-tokens.repository.interface";

@Global()
@Module({
  providers: [
    PrismaService,
    { provide: USERS_REPOSITORY, useClass: UsersRepository },
    {
      provide: GUEST_USERS_REPOSITORY,
      useClass: GuestUsersRepository,
    },
    {
      provide: GROUP_MEMBERS_REPOSITORY,
      useClass: GroupMembersRepository,
    },
    { provide: GROUPS_REPOSITORY, useClass: GroupsRepository },
    {
      provide: GROUP_MATCHES_REPOSITORY,
      useClass: GroupMatchesRepository,
    },
    {
      provide: MATCH_PRESENCES_REPOSITORY,
      useClass: MatchPresencesRepository,
    },
    {
      provide: MATCH_TEAMS_REPOSITORY,
      useClass: MatchTeamsRepository,
    },
    {
      provide: MATCH_TEAM_PLAYERS_REPOSITORY,
      useClass: MatchTeamsPlayersRepository,
    },
    {
      provide: GROUP_PAYMENTS_REPOSITORY,
      useClass: GroupPaymentsRepository,
    },
    {
      provide: GROUP_INVITES_REPOSITORY,
      useClass: GroupInvitesRepository,
    },
    {
      provide: VERIFICATION_TOKENS_REPOSITORY,
      useClass: VerificationTokensRepository,
    },
  ],
  exports: [
    USERS_REPOSITORY,
    GUEST_USERS_REPOSITORY,
    GROUP_MEMBERS_REPOSITORY,
    GROUPS_REPOSITORY,
    GROUP_MATCHES_REPOSITORY,
    MATCH_PRESENCES_REPOSITORY,
    MATCH_TEAMS_REPOSITORY,
    MATCH_TEAM_PLAYERS_REPOSITORY,
    GROUP_PAYMENTS_REPOSITORY,
    GROUP_INVITES_REPOSITORY,
    VERIFICATION_TOKENS_REPOSITORY,
  ],
})
export class DatabaseModule {}
