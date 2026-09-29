import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type {
  IUsersRepository,
  User,
} from "../interfaces/users.repository.interface";
import { PositionEnum } from "@src/shared/enum/positionEnum";
import type { User as PrismaUser } from "../../../../generated/prisma/client";

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    email: string;
    name: string;
    hashedPassword: string;
    position: PositionEnum;
  }): Promise<User> {
    const user = await this.prisma.user.create({ data });
    return this.toDomain(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user ? this.toDomain(user) : null;
  }

  async update(
    id: string,
    data: Partial<
      Pick<
        User,
        | "name"
        | "telefone"
        | "position"
        | "profilePicture"
        | "hashedPassword"
        | "passwordChangedAt"
        | "emailVerifiedAt"
        | "email"
        | "emailNotifications"
      >
    >,
  ): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return this.toDomain(user);
  }

  async delete(id: string): Promise<User> {
    const user = await this.prisma.user.delete({
      where: { id },
    });
    return this.toDomain(user);
  }

  private toDomain(user: PrismaUser): User {
    return { ...user, position: user.position as PositionEnum };
  }
}
