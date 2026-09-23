import { IsInt, Min } from "class-validator";

export class GenerateMatchTeamsDto {
  @IsInt()
  @Min(1)
  playersPerTeam!: number;
}
