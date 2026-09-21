import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { GroupOwnerGuard } from "../groups/guards/group-owner.guard";
import { GroupInvitesService } from "./group-invites.service";

@UseGuards(GroupOwnerGuard)
@Controller("groups/:groupId/invite")
export class GroupInvitesController {
  constructor(
    private readonly groupInvitesService: GroupInvitesService,
  ) {}

  @Get()
  findByGroup(@Param("groupId", ParseUUIDPipe) groupId: string) {
    return this.groupInvitesService.findByGroup(groupId);
  }

  @Post()
  regenerate(@Param("groupId", ParseUUIDPipe) groupId: string) {
    return this.groupInvitesService.regenerate(groupId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  revoke(@Param("groupId", ParseUUIDPipe) groupId: string) {
    return this.groupInvitesService.revoke(groupId);
  }
}
