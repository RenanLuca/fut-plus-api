import { Injectable } from "@nestjs/common";
import { Prisma } from "../../../../generated/prisma/client";
import { PrismaService } from "../prisma.service";

@Injectable()
export class GroupInvitesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUnique<T extends Prisma.GroupInviteFindUniqueArgs>(
    findUniqueGroupInviteDto: Prisma.SelectSubset<
      T,
      Prisma.GroupInviteFindUniqueArgs
    >,
  ) {
    return this.prisma.groupInvite.findUnique(
      findUniqueGroupInviteDto,
    );
  }

  async replaceForGroup(groupId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.groupInvite.deleteMany({ where: { groupId } });
      return tx.groupInvite.create({ data: { groupId } });
    });
  }

  async deleteByGroupId(groupId: string) {
    return this.prisma.groupInvite.deleteMany({
      where: { groupId },
    });
  }
}
