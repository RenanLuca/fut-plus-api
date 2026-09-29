import { Injectable } from "@nestjs/common";
import { Prisma } from "../../../../generated/prisma/client";
import { PrismaService } from "../prisma.service";
import type { IMatchPresencesRepository } from "../interfaces/match-presences.repository.interface";
import type { GroupMatchPresence } from "../interfaces/match-presences.repository.interface";

@Injectable()
export class MatchPresencesRepository implements IMatchPresencesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { groupMatchId: string; isPresent: boolean; userId?: string; guestUserId?: string }): Promise<GroupMatchPresence> {
    return this.prisma.groupMatchPresence.create({ data }) as Promise<GroupMatchPresence>;
  }
  async findById(id: string): Promise<GroupMatchPresence | null> {
    return this.prisma.groupMatchPresence.findUnique({ where: { id } }) as Promise<GroupMatchPresence | null>;
  }
  async findAllByGroupMatchId(groupMatchId: string): Promise<GroupMatchPresence[]> {
    return this.prisma.groupMatchPresence.findMany({ where: { groupMatchId } }) as Promise<GroupMatchPresence[]>;
  }
  async update(id: string, data: Partial<{ isPresent: boolean }>): Promise<GroupMatchPresence> {
    return this.prisma.groupMatchPresence.update({ where: { id }, data }) as Promise<GroupMatchPresence>;
  }
  async delete(id: string): Promise<GroupMatchPresence> {
    return this.prisma.groupMatchPresence.delete({ where: { id } }) as Promise<GroupMatchPresence>;
  }
  async upsert<T extends Prisma.GroupMatchPresenceUpsertArgs>(args: Prisma.SelectSubset<T, Prisma.GroupMatchPresenceUpsertArgs>) {
    return this.prisma.groupMatchPresence.upsert(args);
  }
  async findOne<T extends Prisma.GroupMatchPresenceFindFirstArgs>(args: Prisma.SelectSubset<T, Prisma.GroupMatchPresenceFindFirstArgs>) {
    return this.prisma.groupMatchPresence.findFirst(args);
  }
  async findUnique<T extends Prisma.GroupMatchPresenceFindUniqueArgs>(args: Prisma.SelectSubset<T, Prisma.GroupMatchPresenceFindUniqueArgs>) {
    return this.prisma.groupMatchPresence.findUnique(args);
  }
  async findMany<T extends Prisma.GroupMatchPresenceFindManyArgs>(args: Prisma.SelectSubset<T, Prisma.GroupMatchPresenceFindManyArgs>) {
    return this.prisma.groupMatchPresence.findMany(args);
  }
}
