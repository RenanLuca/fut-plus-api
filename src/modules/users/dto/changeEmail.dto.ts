import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class ChangeEmailDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  newEmail!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
