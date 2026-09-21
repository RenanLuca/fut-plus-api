import { Module } from "@nestjs/common";
import { GroupsModule } from "../groups/groups.module";
import { GroupInvitesController } from "./group-invites.controller";
import { GroupInvitesService } from "./group-invites.service";
import { InvitesController } from "./invites.controller";

@Module({
  imports: [GroupsModule],
  controllers: [GroupInvitesController, InvitesController],
  providers: [GroupInvitesService],
})
export class GroupInvitesModule {}
