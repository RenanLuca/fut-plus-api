import { IsNotEmpty, IsUUID } from "class-validator";

export class TransferOwnershipDto {
  @IsUUID()
  @IsNotEmpty()
  newOwnerId!: string;
}
