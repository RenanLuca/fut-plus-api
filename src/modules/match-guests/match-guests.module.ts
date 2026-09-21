import { Module } from "@nestjs/common";
import { GroupMatchesModule } from "../group-matches/group-matches.module";
import { GroupsModule } from "../groups/groups.module";
import { MatchGuestsController } from "./match-guests.controller";
import { MatchGuestsService } from "./match-guests.service";

@Module({
  imports: [GroupMatchesModule, GroupsModule],
  controllers: [MatchGuestsController],
  providers: [MatchGuestsService],
  exports: [MatchGuestsService],
})
export class MatchGuestsModule {}
