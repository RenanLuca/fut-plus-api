import { PartialType } from "@nestjs/mapped-types";
import { CreateGroupPaymentDto } from "./create-group-payment.dto";

export class UpdateGroupPaymentDto extends PartialType(
  CreateGroupPaymentDto,
) {}
