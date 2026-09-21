import { PositionEnum } from "@src/shared/enum/positionEnum";
import { UserRank } from "@src/shared/enum/userRank";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export class CreateMatchGuestDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(PositionEnum)
  @IsNotEmpty()
  position!: PositionEnum;

  @IsEnum(UserRank)
  @IsNotEmpty()
  rank!: UserRank;
}
