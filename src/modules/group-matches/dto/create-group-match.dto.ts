import {
  IsDateString,
  IsNotEmpty,
  Matches,
} from "class-validator";

export class CreateGroupMatchDto {
  @IsNotEmpty()
  @IsDateString()
  @Matches(/(Z|[+-]\d{2}:\d{2})$/, {
    message:
      "matchDate must include an explicit UTC offset (e.g. Z or -03:00)",
  })
  matchDate!: string;
}
