import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthModule } from "./modules/auth/auth.module";
import { DatabaseModule } from "./shared/database/database.module";
import { AuthGuard } from "./modules/auth/auth.guard";
import { APP_GUARD } from "@nestjs/core";
import { UsersModule } from "./modules/users/users.module";
import { MatchGuestsModule } from "./modules/match-guests/match-guests.module";
import { GroupsModule } from "./modules/groups/groups.module";
import { GroupMembersModule } from "./modules/group-members/group-members.module";
import { GroupMatchesModule } from "./modules/group-matches/group-matches.module";
import { MatchPresencesModule } from "./modules/match-presences/match-presences.module";
import { MatchTeamsModule } from "./modules/match-teams/match-teams.module";
import { MatchTeamPlayersModule } from "./modules/match-team-players/match-team-players.module";
import { GroupPaymentsModule } from "./modules/group-payments/group-payments.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    GroupsModule,
    GroupMembersModule,
    GroupMatchesModule,
    MatchGuestsModule,
    MatchPresencesModule,
    MatchTeamsModule,
    MatchTeamPlayersModule,
    GroupPaymentsModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
