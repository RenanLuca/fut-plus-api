import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type {
  ConfirmedGuest,
  CreateGuestUserDTO,
  GuestUser,
  IGuestUsersRepository,
} from "../interfaces/guest-users.repository.interface";
import { PositionEnum } from "@src/shared/enum/positionEnum";
import { UserRank } from "@src/shared/enum/userRank";
import {
  toPositionEnum,
  toUserRank,
} from "@src/shared/utils/enum-casters";
import type { GuestUser as PrismaGuestUser } from "../../../../generated/prisma/client";

@Injectable()
export class GuestUsersRepository implements IGuestUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateGuestUserDTO): Promise<GuestUser> {
    const guest = await this.prisma.guestUser.create({ data });
    return this.toDomain(guest);
  }

  async findByIdAndGroupMatchId(
    id: string,
    groupMatchId: string,
  ): Promise<GuestUser | null> {
    const guest = await this.prisma.guestUser.findFirst({
      where: { id, groupMatchId },
    });
    return guest ? this.toDomain(guest) : null;
  }

  async findAllByGroupMatchId(
    groupMatchId: string,
  ): Promise<GuestUser[]> {
    const guests = await this.prisma.guestUser.findMany({
      where: { groupMatchId },
    });
    return guests.map((guest) => this.toDomain(guest));
  }

  async findConfirmedGuestsByGroupMatchId(
    groupMatchId: string,
  ): Promise<ConfirmedGuest[]> {
    const guests = await this.prisma.guestUser.findMany({
      where: {
        groupMatchId,
        groupMatchPresences: { some: { isPresent: true } },
      },
      select: { id: true, rank: true, position: true },
    });
    return guests.map((guest) => ({
      id: guest.id,
      rank: toUserRank(guest.rank),
      position: toPositionEnum(guest.position),
    }));
  }

  async delete(id: string): Promise<GuestUser> {
    const guest = await this.prisma.guestUser.delete({
      where: { id },
    });
    return this.toDomain(guest);
  }

  private toDomain(guest: PrismaGuestUser): GuestUser {
    return {
      ...guest,
      position: toPositionEnum(guest.position),
      rank: toUserRank(guest.rank),
    };
  }
}
