import { Module } from "@nestjs/common";
import { AuthService } from "./services/auth.service";
import { VerificationTokensService } from "./services/verification-tokens.service";
import { AuthController } from "./auth.controller";
import { JwtModule } from "@nestjs/jwt";
import { env } from "@src/shared/config/env";
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: env.jwtSecret,
      signOptions: { expiresIn: "1d" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, VerificationTokensService],
  exports: [AuthService, VerificationTokensService],
})
export class AuthModule {}
