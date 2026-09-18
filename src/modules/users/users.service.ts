import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UsersRepository } from "@src/shared/database/repositories/users.repository";
import { GroupMatchesRepository } from "@src/shared/database/repositories/group-matches.repository";
import { UpdateUserDto } from "./dto/updateUser.dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly groupMatchesRepository: GroupMatchesRepository,
  ) {}
  async checkIfUserExists(userId: string) {
    const user = await this.usersRepository.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  private async checkEmailAvailability(email: string) {
    const user = await this.usersRepository.findUnique({
      where: {
        email,
      },
    });
    if (user) {
      throw new ConflictException("Email is already in use");
    }
  }

  async getUserById(userId: string) {
    const user = await this.checkIfUserExists(userId);
    const { hashedPassword, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    await this.checkIfUserExists(userId);
    if (updateUserDto.email) {
      await this.checkEmailAvailability(updateUserDto.email);
    }
    const updatedUser = await this.usersRepository.update({
      where: {
        id: userId,
      },
      data: updateUserDto,
    });
    const { hashedPassword, ...userWithoutPassword } =
      updatedUser;
    return userWithoutPassword;
  }

  async delete(userId: string) {
    await this.checkIfUserExists(userId);
    return this.usersRepository.delete({
      where: {
        id: userId,
      },
    });
  }

  async getUpcomingMatch(userId: string) {
    return this.groupMatchesRepository.findOne({
      where: {
        matchDate: { gte: new Date() },
        group: {
          groupMembers: { some: { userId } },
        },
      },
      orderBy: { matchDate: "asc" },
      include: {
        group: {
          select: { id: true, name: true, valuePerUser: true },
        },
      },
    });
  }
}
