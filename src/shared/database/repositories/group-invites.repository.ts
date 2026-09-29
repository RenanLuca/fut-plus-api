import { Injectable } from "@nestjs/common";
import { Prisma } from "../../../../generated/prisma/client";
import { PrismaService } from "../prisma.service";
import {
  GroupInvite,
  IGroupInvitesRepository,
} from "../interfaces/group-invites.repository.interface";

@Injectable()
export class GroupInvitesRepository implements IGroupInvitesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByGroupId(groupId: string): Promise<GroupInvite | null> {
    const invite = await this.prisma.groupInvite.findUnique({
      where: { groupId },
    });
    return invite ? this.toDomain(invite) : null;
  }

  async findById(
    id: string,
    options?: {
      includeGroupWithDetails?: boolean;
    },
  ): Promise<
    | (GroupInvite & {
        group?: {
          id: string;
          name: string;
          weekday: string;
          hour: string;
          frequency: string;
          valuePerUser: number;
          owner: { name: string };
          _count: { groupMembers: number };
        };
      })
    | null
  > {
    const invite = await this.prisma.groupInvite.findUnique({
      where: { id },
      ...(options?.includeGroupWithDetails
        ? {
            include: {
              group: {
                include: {
                  owner: { select: { name: true } },
                  _count: { select: { groupMembers: true } },
                },
              },
            },
          }
        : {}),
    }) as any;
    return invite
      ? {
          ...this.toDomain(invite),
          group: invite.group || undefined,
        }
      : null;
  }

  async replaceForGroup(groupId: string): Promise<GroupInvite> {
    const invite = await this.prisma.$transaction(async (tx) => {
      await tx.groupInvite.deleteMany({ where: { groupId } });
      return tx.groupInvite.create({ data: { groupId } });
    });
    return this.toDomain(invite);
  }

  async deleteByGroupId(groupId: string): Promise<{ count: number }> {
    return this.prisma.groupInvite.deleteMany({
      where: { groupId },
    });
  }

  // Métodos legados para compatibilidade com serviços não migrados
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

  private toDomain(invite: any): GroupInvite {
    return {
      ...invite,
    };
  }
}
