import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { GroupOwnerGuard } from "../groups/guards/group-owner.guard";
import { CreateMatchGuestDto } from "./dto/create-match-guest.dto";
import { MatchGuestsService } from "./match-guests.service";

@Controller("groups/:groupId/group-matches/:matchId/guests")
export class MatchGuestsController {
  constructor(
    private readonly matchGuestsService: MatchGuestsService,
  ) {}

  @UseGuards(GroupOwnerGuard)
  @Post()
  create(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @Param("matchId", ParseUUIDPipe) matchId: string,
    @Body() createMatchGuestDto: CreateMatchGuestDto,
  ) {
    return this.matchGuestsService.create(
      groupId,
      matchId,
      createMatchGuestDto,
    );
  }

  @UseGuards(GroupOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":guestUserId")
  remove(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @Param("matchId", ParseUUIDPipe) matchId: string,
    @Param("guestUserId", ParseUUIDPipe) guestUserId: string,
  ) {
    return this.matchGuestsService.remove(
      groupId,
      matchId,
      guestUserId,
    );
  }
}
