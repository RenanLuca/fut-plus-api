import { GroupMemberType } from "@src/shared/enum/groupMemberType";
import { UserRank } from "@src/shared/enum/userRank";
import { IsEnum, IsIn, IsNotEmpty } from "class-validator";

export class AcceptInviteDto {
  @IsNotEmpty()
  @IsIn(
    Object.values(GroupMemberType).filter(
      (t) => t !== GroupMemberType.OWNER,
    ),
  )
  type!: Exclude<GroupMemberType, GroupMemberType.OWNER>;
  @IsNotEmpty()
  @IsEnum(UserRank)
  rank!: UserRank;
}
