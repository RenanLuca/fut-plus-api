import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import { GroupMembersService } from "./group-members.service";
import { ActiveUserId } from "@src/shared/decorators/ActiveUserId";
import { GroupOwnerGuard } from "../groups/guards/group-owner.guard";

@Controller("groups/:groupId/group-members")
export class GroupMembersController {
  constructor(
    private readonly groupMembersService: GroupMembersService,
  ) {}

  @Get()
  findAllPerGroup(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @ActiveUserId() userId: string,
  ) {
    return this.groupMembersService.findMembersByGroupId(
      userId,
      groupId,
    );
  }

  @UseGuards(GroupOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("user/:userId")
  removeUser(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
  ) {
    return this.groupMembersService.removeGroupMember(
      groupId,
      userId,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("leave")
  leaveGroup(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @ActiveUserId() userId: string,
  ) {
    return this.groupMembersService.removeGroupMember(
      groupId,
      userId,
    );
  }
}
