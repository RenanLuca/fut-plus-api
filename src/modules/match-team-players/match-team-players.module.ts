import { Module } from "@nestjs/common";
import { MatchTeamPlayersService } from "./match-team-players.service";
import { MatchTeamPlayersController } from "./match-team-players.controller";
import { GroupsModule } from "../groups/groups.module";
import { GroupMatchesModule } from "../group-matches/group-matches.module";
import { MatchTeamsModule } from "../match-teams/match-teams.module";
import { MatchGuestsModule } from "../match-guests/match-guests.module";

@Module({
  imports: [
    GroupsModule,
    GroupMatchesModule,
    MatchTeamsModule,
    MatchGuestsModule,
  ],
  controllers: [MatchTeamPlayersController],
  providers: [MatchTeamPlayersService],
})
export class MatchTeamPlayersModule {}
