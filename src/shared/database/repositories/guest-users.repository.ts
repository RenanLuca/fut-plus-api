import { Injectable } from "@nestjs/common";
import { Prisma } from "../../../../generated/prisma/client";
import { PrismaService } from "../prisma.service";
import type { IGuestUsersRepository } from "../interfaces/guest-users.repository.interface";
import type { GuestUser } from "../interfaces/guest-users.repository.interface";
import { Position } from "@src/shared/enum/positionEnum";
import { UserRank } from "@src/shared/enum/userRank";

@Injectable()
export class GuestUsersRepository implements IGuestUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; position: Position; rank: UserRank; groupMatchId: string }): Promise<GuestUser> {
    return this.prisma.guestUser.create({ data }) as Promise<GuestUser>;
  }
  async findById(id: string): Promise<GuestUser | null> {
    return this.prisma.guestUser.findUnique({ where: { id } }) as Promise<GuestUser | null>;
  }
  async findAllByGroupMatchId(groupMatchId: string): Promise<GuestUser[]> {
    return this.prisma.guestUser.findMany({ where: { groupMatchId } }) as Promise<GuestUser[]>;
  }
  async delete(id: string): Promise<GuestUser> {
    return this.prisma.guestUser.delete({ where: { id } }) as Promise<GuestUser>;
  }
  async createConfirmedForMatch(data: { name: string; position: string; rank: string; groupMatchId: string }) {
    return this.prisma.guestUser.create({ data: { ...data, position: data.position as any, rank: data.rank as any } });
  }
  async findFirst<T extends Prisma.GuestUserFindFirstArgs>(args: Prisma.SelectSubset<T, Prisma.GuestUserFindFirstArgs>) {
    return this.prisma.guestUser.findFirst(args);
  }
  async findUnique<T extends Prisma.GuestUserFindUniqueArgs>(args: Prisma.SelectSubset<T, Prisma.GuestUserFindUniqueArgs>) {
    return this.prisma.guestUser.findUnique(args);
  }
  async findMany<T extends Prisma.GuestUserFindManyArgs>(args: Prisma.SelectSubset<T, Prisma.GuestUserFindManyArgs>) {
    return this.prisma.guestUser.findMany(args);
  }
}
