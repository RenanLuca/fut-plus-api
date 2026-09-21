import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { ActiveUserId } from "@src/shared/decorators/ActiveUserId";
import { AcceptInviteDto } from "./dto/accept-invite.dto";
import { GroupInvitesService } from "./group-invites.service";

@Controller("invites")
export class InvitesController {
  constructor(
    private readonly groupInvitesService: GroupInvitesService,
  ) {}

  @Get(":inviteId")
  preview(
    @Param("inviteId", ParseUUIDPipe) inviteId: string,
    @ActiveUserId() userId: string,
  ) {
    return this.groupInvitesService.preview(inviteId, userId);
  }

  @Post(":inviteId/accept")
  accept(
    @Param("inviteId", ParseUUIDPipe) inviteId: string,
    @ActiveUserId() userId: string,
    @Body() acceptInviteDto: AcceptInviteDto,
  ) {
    return this.groupInvitesService.accept(
      inviteId,
      userId,
      acceptInviteDto,
    );
  }
}
