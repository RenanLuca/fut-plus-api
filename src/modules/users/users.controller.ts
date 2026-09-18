import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Put,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { ActiveUserId } from "@src/shared/decorators/ActiveUserId";
import { UpdateUserDto } from "./dto/updateUser.dto";

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
  update(@Body() updateUserDto: UpdateUserDto, @ActiveUserId() userId: string) {
    return this.usersService.update(userId, updateUserDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  delete(@ActiveUserId() userId: string) {
    return this.usersService.delete(userId);
  }
}
