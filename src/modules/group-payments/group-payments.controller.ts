import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { GroupPaymentsService } from "./group-payments.service";
import { CreateGroupPaymentDto } from "./dto/create-group-payment.dto";
import { UpdateGroupPaymentDto } from "./dto/update-group-payment.dto";
import { ActiveUserId } from "@src/shared/decorators/ActiveUserId";
import { GroupOwnerGuard } from "../groups/guards/group-owner.guard";
import { PaymentFilterQueryDto } from "./dto/payment-filter-query.dto";

@Controller("groups/:groupId/group-payments")
export class GroupPaymentsController {
  constructor(
    private readonly groupPaymentsService: GroupPaymentsService,
  ) {}

  @Post()
  create(
    @Body() createGroupPaymentDto: CreateGroupPaymentDto,
    @ActiveUserId() userId: string,
    @Param("groupId") groupId: string,
  ) {
    return this.groupPaymentsService.create({
      createGroupPaymentDto,
      userId,
      groupId,
    });
  }

  @UseGuards(GroupOwnerGuard)
  @Get()
  findAllByGroup(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @Query() pagination: PaymentFilterQueryDto,
  ) {
    return this.groupPaymentsService.findAllByGroup(
      groupId,
      pagination,
    );
  }

  @Get("me")
  findAllByUser(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @ActiveUserId() userId: string,
    @Query() pagination: PaymentFilterQueryDto,
  ) {
    return this.groupPaymentsService.findAllByUser(
      groupId,
      userId,
      pagination,
    );
  }

  @Get("pending-matches")
  findPendingMatches(
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @ActiveUserId() userId: string,
  ) {
    return this.groupPaymentsService.findPendingMatches(
      groupId,
      userId,
    );
  }

  @Get(":paymentId")
  findOne(
    @Param("paymentId", ParseUUIDPipe) paymentId: string,
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @ActiveUserId() userId: string,
  ) {
    return this.groupPaymentsService.findOne({
      userId,
      paymentId,
      groupId,
    });
  }
}
