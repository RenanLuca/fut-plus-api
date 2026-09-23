import { FrequencyType } from "@src/shared/enum/FrequencyType";
import { UserRank } from "@src/shared/enum/userRank";
import { Weekday } from "../../../shared/enum/weekday";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
} from "class-validator";

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
  @IsEnum(Weekday)
  @IsNotEmpty()
  weekday!: Weekday;
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: "hour must be in HH:mm format (24h)",
  })
  hour!: string;

  @IsEnum(FrequencyType)
  @IsNotEmpty()
  frequency!: FrequencyType;

  @IsNotEmpty()
  @IsNumber()
  valuePerUser!: number;

  @IsEnum(UserRank)
  @IsNotEmpty()
  rank!: UserRank;
}
