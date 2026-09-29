import { Module } from "@nestjs/common";
import { GroupsService } from "./services/groups.service";
import { GroupsController } from "./groups.controller";
import { UserBelongsToGroupService } from "./services/userBelongsToGroup.service";
import { GroupOwnerGuard } from "./guards/group-owner.guard";

@Module({
  controllers: [GroupsController],
  providers: [
    GroupsService,
    UserBelongsToGroupService,
    GroupOwnerGuard,
  ],
  exports: [
    GroupsService,
    UserBelongsToGroupService,
    GroupOwnerGuard,
  ],
})
export class GroupsModule {}
