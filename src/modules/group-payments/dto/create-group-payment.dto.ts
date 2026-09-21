import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsUrl,
  IsUUID,
} from "class-validator";

export class CreateGroupPaymentDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;
  @IsUrl()
  @IsOptional()
  receipt?: string;
  @IsOptional()
  @IsUUID()
  matchId?: string;
}
