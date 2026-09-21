import { Module } from "@nestjs/common";
import { GroupMembersService } from "./group-members.service";
import { GroupMembersController } from "./group-members.controller";
import { GroupsModule } from "../groups/groups.module";

@Module({
  imports: [GroupsModule],
  controllers: [GroupMembersController],
  providers: [GroupMembersService],
})
export class GroupMembersModule {}
