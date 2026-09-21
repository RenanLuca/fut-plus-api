import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from "@nestjs/common";
import { GroupsService } from "./services/groups.service";
import { CreateGroupDto } from "./dto/create-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";
import { TransferOwnershipDto } from "./dto/transfer-ownership.dto";
import { ActiveUserId } from "@src/shared/decorators/ActiveUserId";

@Controller("groups")
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(
    @Body() createGroupDto: CreateGroupDto,
    @ActiveUserId() ownerId: string,
  ) {
    return this.groupsService.create(createGroupDto, ownerId);
  }

  @Get()
  findAll(@ActiveUserId() userId: string) {
    return this.groupsService.findAllGroupsPerUser(userId);
  }

  @Get(":id")
  findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUserId() userId: string,
  ) {
    return this.groupsService.findOne(userId, id);
  }

  @Put(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUserId() userId: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    return this.groupsService.update(id, updateGroupDto, userId);
  }

  @Patch(":id/transfer-ownership")
  transferOwnership(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUserId() userId: string,
    @Body() transferOwnershipDto: TransferOwnershipDto,
  ) {
    return this.groupsService.transferOwnership(
      id,
      userId,
      transferOwnershipDto,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  remove(
    @Param("id", ParseUUIDPipe) id: string,
    @ActiveUserId() userId: string,
  ) {
    return this.groupsService.remove(id, userId);
  }
}
