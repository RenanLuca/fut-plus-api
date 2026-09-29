import { Injectable } from "@nestjs/common";
import { Prisma } from "../../../../generated/prisma/client";
import { PrismaService } from "../prisma.service";
import type { IGroupMatchesRepository } from "../interfaces/group-matches.repository.interface";
import type { GroupMatch } from "../interfaces/group-matches.repository.interface";

@Injectable()
export class GroupMatchesRepository implements IGroupMatchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { groupId: string; matchDate: Date }): Promise<GroupMatch> {
    return this.prisma.groupMatch.create({ data }) as Promise<GroupMatch>;
  }
  async findById(id: string): Promise<GroupMatch | null> {
    return this.prisma.groupMatch.findUnique({ where: { id } }) as Promise<GroupMatch | null>;
  }
  async findByGroupIdAndDate(groupId: string, matchDate: Date): Promise<GroupMatch | null> {
    return this.prisma.groupMatch.findUnique({ where: { groupId_matchDate: { groupId, matchDate } } }) as Promise<GroupMatch | null>;
  }
  async findAllByGroupId(groupId: string): Promise<GroupMatch[]> {
    return this.prisma.groupMatch.findMany({ where: { groupId } }) as Promise<GroupMatch[]>;
  }
  async update(id: string, data: Partial<{ matchDate: Date }>): Promise<GroupMatch> {
    return this.prisma.groupMatch.update({ where: { id }, data }) as Promise<GroupMatch>;
  }
  async delete(id: string): Promise<GroupMatch> {
    return this.prisma.groupMatch.delete({ where: { id } }) as Promise<GroupMatch>;
  }
  async findUnique<T extends Prisma.GroupMatchFindUniqueArgs>(args: Prisma.SelectSubset<T, Prisma.GroupMatchFindUniqueArgs>) {
    return this.prisma.groupMatch.findUnique(args);
  }
  async findOne<T extends Prisma.GroupMatchFindFirstArgs>(args: Prisma.SelectSubset<T, Prisma.GroupMatchFindFirstArgs>) {
    return this.prisma.groupMatch.findFirst(args);
  }
  async findMany<T extends Prisma.GroupMatchFindManyArgs>(args: Prisma.SelectSubset<T, Prisma.GroupMatchFindManyArgs>) {
    return this.prisma.groupMatch.findMany(args);
  }
}
