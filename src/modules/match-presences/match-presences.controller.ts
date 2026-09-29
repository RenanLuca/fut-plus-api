import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from "@nestjs/common";
import { MatchPresencesService } from "./match-presences.service";
import { UpdateMatchPresenceDto } from "./dto/updateMatchPresence.dto";
import { ActiveUserId } from "@src/shared/decorators/ActiveUserId";

@Controller(
  "groups/:groupId/group-matches/:matchId/match-presences",
)
export class MatchPresencesController {
  constructor(
    private readonly matchPresencesService: MatchPresencesService,
  ) {}

  @Get()
  findAll(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @Param("matchId", ParseUUIDPipe) matchId: string,
    @ActiveUserId() userId: string,
  ) {
    return this.matchPresencesService.findMatchPresences(
      groupId,
      matchId,
      userId,
    );
  }

  @Patch()
  async updateMatchPresence(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @Param("matchId", ParseUUIDPipe) matchId: string,
    @ActiveUserId() userId: string,
    @Body() updateMatchPresence: UpdateMatchPresenceDto,
  ) {
    return await this.matchPresencesService.updateMatchPresences(
      userId,
      groupId,
      matchId,
      updateMatchPresence,
    );
  }
}
