import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { SigninDto } from "./dto/signin.dto";
import { SignupDto } from "./dto/signup.dto";
import { UsersRepository } from "@src/shared/database/repositories/users.repository";
import { compare, hash } from "bcryptjs";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async signin(signinDto: SigninDto) {
    const { email, password } = signinDto;

    const user = await this.usersRepository.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const accessToken = await this.generateAccessToken(user.id);

    return { accessToken };
  }

  async signup(signupDto: SignupDto) {
    const { email, password, name, position } = signupDto;

    const existingUser = await this.usersRepository.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      throw new ConflictException("User already exists");
    }

    const hashedPassword = await this.hashPassword(password, 10);

    const user = await this.usersRepository.create({
      data: {
        email: email,
        hashedPassword: hashedPassword,
        name: name,
        position: position,
      },
    });

    const accessToken = await this.generateAccessToken(user.id);

    return { accessToken };
  }

  private async generateAccessToken(userId: string) {
    const payload = { sub: userId };
    return this.jwtService.signAsync(payload);
  }

  private async hashPassword(password: string, salt: number): Promise<string> {
    const hashedPassword = await hash(password, salt);
    return hashedPassword;
  }
}
