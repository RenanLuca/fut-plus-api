import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class ResendVerificationDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
