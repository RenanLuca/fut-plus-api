import { Injectable } from "@nestjs/common";
import {
  Position,
  Prisma,
  Rank,
} from "../../../../generated/prisma/client";
import { PrismaService } from "../prisma.service";

@Injectable()
export class GuestUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createConfirmedForMatch({
    groupMatchId,
    name,
    position,
    rank,
  }: {
    groupMatchId: string;
    name: string;
    position: Position;
    rank: Rank;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const guestUser = await tx.guestUser.create({
        data: { groupMatchId, name, position, rank },
      });
      await tx.groupMatchPresence.create({
        data: {
          groupMatchId,
          guestUserId: guestUser.id,
          isPresent: true,
        },
      });
      return guestUser;
    });
  }

  async findMany<T extends Prisma.GuestUserFindManyArgs>(
    findManyGuestUserDto: Prisma.SelectSubset<
      T,
      Prisma.GuestUserFindManyArgs
    >,
  ) {
    return this.prisma.guestUser.findMany(findManyGuestUserDto);
  }

  async findFirst(
    findFirstGuestUserDto: Prisma.GuestUserFindFirstArgs,
  ) {
    return this.prisma.guestUser.findFirst(
      findFirstGuestUserDto,
    );
  }

  async delete(deleteGuestUserDto: Prisma.GuestUserDeleteArgs) {
    return this.prisma.guestUser.delete(deleteGuestUserDto);
  }
}
