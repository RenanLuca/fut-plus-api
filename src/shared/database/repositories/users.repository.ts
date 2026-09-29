import { Injectable } from "@nestjs/common";
import { Prisma } from "../../../../generated/prisma/client";
import { PrismaService } from "../prisma.service";
import type { IUsersRepository } from "../interfaces/users.repository.interface";
import type { User } from "../interfaces/users.repository.interface";

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}
  async create(data: {
    email: string;
    name: string;
    passwordHash: string;
    position?: string;
    profilePicture?: string;
  }): Promise<User> {
    return this.prisma.user.create({ data }) as Promise<User>;
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } }) as Promise<User | null>;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } }) as Promise<User | null>;
  }

  async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
    return this.prisma.user.update({ where: { id }, data }) as Promise<User>;
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } }) as Promise<User>;
  }

  // Métodos legados
  async findUnique(findUniqueUserDto: Prisma.UserFindUniqueArgs) {
    return this.prisma.user.findUnique(findUniqueUserDto);
  }
}
