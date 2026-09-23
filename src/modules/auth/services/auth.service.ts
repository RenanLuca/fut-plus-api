import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { SigninDto } from "../dto/signin.dto";
import { SignupDto } from "../dto/signup.dto";
import { VerifyEmailDto } from "../dto/verifyEmail.dto";
import { ResendVerificationDto } from "../dto/resendVerification.dto";
import { UsersRepository } from "@src/shared/database/repositories/users.repository";
import { compare, hash } from "bcryptjs";
import { JwtService } from "@nestjs/jwt";
import { env } from "@src/shared/config/env";
import { MailService } from "@src/modules/mail/mail.service";
import { verifyEmailTemplate } from "@src/modules/mail/templates/verify-email.template";
import { welcomeTemplate } from "@src/modules/mail/templates/welcome.template";
import { VerificationTokenType } from "../../../../generated/prisma/client";
import { EMAIL_VERIFICATION_TOKEN_TTL_MS } from "../constants/tokenTtl";
import { VerificationTokensService } from "./verification-tokens.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly verificationTokensService: VerificationTokensService,
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

    const isPasswordValid = await compare(
      password,
      user.hashedPassword,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Checked only after the password, so an unverified account isn't
    // revealed to someone who doesn't know its password.
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException("Email not verified");
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

    await this.sendVerificationEmail(user);

    return { message: "Verification email sent" };
  }

  async verifyEmail({ token }: VerifyEmailDto) {
    const { userId } =
      await this.verificationTokensService.consume(
        token,
        VerificationTokenType.EMAIL_VERIFICATION,
      );

    const user = await this.usersRepository.findUnique({
      where: { id: userId },
    });
    if (!user || user.emailVerifiedAt) {
      return { message: "Email verified" };
    }

    await this.usersRepository.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });

    void this.mailService.send({
      to: user.email,
      ...welcomeTemplate({
        name: user.name,
        url: env.frontendUrl,
      }),
    });

    return { message: "Email verified" };
  }

  async resendVerification({ email }: ResendVerificationDto) {
    const user = await this.usersRepository.findUnique({
      where: { email },
    });
    if (user && !user.emailVerifiedAt) {
      await this.sendVerificationEmail(user);
    }

    // Same answer whether or not the account exists, so this route can't
    // be used to discover which emails are registered.
    return {
      message:
        "If the account exists and is unverified, an email was sent",
    };
  }

  async generateAccessToken(userId: string) {
    const payload = { sub: userId };
    return this.jwtService.signAsync(payload);
  }

  private async sendVerificationEmail(user: {
    id: string;
    name: string;
    email: string;
  }) {
    const token = await this.verificationTokensService.issue({
      userId: user.id,
      type: VerificationTokenType.EMAIL_VERIFICATION,
      ttlMs: EMAIL_VERIFICATION_TOKEN_TTL_MS,
    });

    void this.mailService.send({
      to: user.email,
      ...verifyEmailTemplate({
        name: user.name,
        url: `${env.frontendUrl}/verify-email?token=${token}`,
      }),
    });
  }

  private async hashPassword(
    password: string,
    salt: number,
  ): Promise<string> {
    const hashedPassword = await hash(password, salt);
    return hashedPassword;
  }
}
