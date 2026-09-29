import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type {
  GroupInvite,
  GroupInviteWithGroup,
  IGroupInvitesRepository,
} from "../interfaces/group-invites.repository.interface";

@Injectable()
export class GroupInvitesRepository implements IGroupInvitesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByGroupId(
    groupId: string,
  ): Promise<GroupInvite | null> {
    return this.prisma.groupInvite.findUnique({
      where: { groupId },
    });
  }

  async findById(id: string): Promise<GroupInvite | null> {
    return this.prisma.groupInvite.findUnique({ where: { id } });
  }

  async findByIdWithGroupDetails(
    id: string,
  ): Promise<GroupInviteWithGroup | null> {
    return this.prisma.groupInvite.findUnique({
      where: { id },
      include: {
        group: {
          include: {
            owner: { select: { name: true } },
            _count: { select: { groupMembers: true } },
          },
        },
      },
    });
  }

  async replaceForGroup(groupId: string): Promise<GroupInvite> {
    return this.prisma.$transaction(async (tx) => {
      await tx.groupInvite.deleteMany({ where: { groupId } });
      return tx.groupInvite.create({ data: { groupId } });
    });
  }

  async deleteByGroupId(
    groupId: string,
  ): Promise<{ count: number }> {
    return this.prisma.groupInvite.deleteMany({
      where: { groupId },
    });
  }
}
