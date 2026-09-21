import { PositionEnum } from "@src/shared/enum/positionEnum";
import { Transform, TransformFnParams } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
} from "class-validator";

const emptyToNull = ({ value }: TransformFnParams): unknown =>
  value === "" ? null : value;

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(PositionEnum)
  @IsOptional()
  position?: PositionEnum;

  @Transform(emptyToNull)
  @IsOptional()
  @IsUrl({
    require_protocol: true,
    protocols: ["http", "https"],
  })
  profilePicture?: string | null;

  @Transform(emptyToNull)
  @IsOptional()
  @Matches(/^\d{10,11}$/, {
    message: "telefone must contain only 10 or 11 digits",
  })
  telefone?: string | null;
}
