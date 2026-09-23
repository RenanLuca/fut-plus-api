import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { AuthService } from "./services/auth.service";
import { SigninDto } from "./dto/signin.dto";
import { SignupDto } from "./dto/signup.dto";
import { VerifyEmailDto } from "./dto/verifyEmail.dto";
import { ResendVerificationDto } from "./dto/resendVerification.dto";
import { ForgotPasswordDto } from "./dto/forgotPassword.dto";
import { ResetPasswordDto } from "./dto/resetPassword.dto";
import { IsPublic } from "@src/shared/decorators/IsPublic";

// Routes that send an email get a tighter limit than the module default,
// since each call costs a send and can be aimed at any address.
const EMAIL_SENDING_THROTTLE = {
  default: { limit: 3, ttl: 60_000 },
};

@IsPublic()
@UseGuards(ThrottlerGuard)
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signin")
  signin(@Body() signinDto: SigninDto) {
    return this.authService.signin(signinDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("signup")
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post("verify-email")
  verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Throttle(EMAIL_SENDING_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post("resend-verification")
  resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ) {
    return this.authService.resendVerification(
      resendVerificationDto,
    );
  }

  @Throttle(EMAIL_SENDING_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post("forgot-password")
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post("reset-password")
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
