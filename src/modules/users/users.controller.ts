import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { IsPublic } from "@src/shared/decorators/IsPublic";
import { UsersService } from "./users.service";
import { ActiveUserId } from "@src/shared/decorators/ActiveUserId";
import { UpdateUserDto } from "./dto/updateUser.dto";
import { ChangePasswordDto } from "./dto/changePassword.dto";
import { ChangeEmailDto } from "./dto/changeEmail.dto";
import { ConfirmEmailChangeDto } from "./dto/confirmEmailChange.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  me(@ActiveUserId() userId: string) {
    return this.usersService.getUserById(userId);
  }

  @Get("me/upcoming-match")
  upcomingMatch(@ActiveUserId() userId: string) {
    return this.usersService.getUpcomingMatch(userId);
  }

  @Put()
  update(
    @Body() updateUserDto: UpdateUserDto,
    @ActiveUserId() userId: string,
  ) {
    return this.usersService.update(userId, updateUserDto);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post("change-password")
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @ActiveUserId() userId: string,
  ) {
    return this.usersService.changePassword(
      userId,
      changePasswordDto,
    );
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post("change-email")
  changeEmail(
    @Body() changeEmailDto: ChangeEmailDto,
    @ActiveUserId() userId: string,
  ) {
    return this.usersService.changeEmail(userId, changeEmailDto);
  }

  // Public on purpose: the link in the email is opened in whatever
  // browser the user has, and the token itself proves who they are.
  @IsPublic()
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @Post("confirm-email-change")
  confirmEmailChange(
    @Body() confirmEmailChangeDto: ConfirmEmailChangeDto,
  ) {
    return this.usersService.confirmEmailChange(
      confirmEmailChangeDto,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  delete(@ActiveUserId() userId: string) {
    return this.usersService.delete(userId);
  }
}
