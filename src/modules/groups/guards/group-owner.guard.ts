import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { Request } from "express";
import { GroupsService } from "../services/groups.service";

@Injectable()
export class GroupOwnerGuard implements CanActivate {
  constructor(private readonly groupsService: GroupsService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const groupId = request.params.groupId as string;
    const userId = request.userId as string;

    await this.groupsService.checkIfUserIsOwner(groupId, userId);
    return true;
  }
}
