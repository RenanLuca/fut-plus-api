import { mock } from "vitest-mock-extended";
import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException } from "@nestjs/common";
import { describe, it, expect, beforeEach } from "vitest";
import { GroupOwnerGuard } from "@src/modules/groups/guards/group-owner.guard";
import { GroupsService } from "@src/modules/groups/services/groups.service";

const groupsServiceMock = mock<GroupsService>();

function makeContext(params: Record<string, string>, userId?: string) {
  const request = { params, userId };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

let sut: GroupOwnerGuard;
beforeEach(() => {
  sut = new GroupOwnerGuard(groupsServiceMock);
});

describe("GroupOwnerGuard", () => {
  it("should allow the request when the user owns the group", async () => {
    groupsServiceMock.checkIfUserIsOwner.mockResolvedValueOnce(true);

    await expect(
      sut.canActivate(
        makeContext({ groupId: "group-id" }, "owner-id"),
      ),
    ).resolves.toBe(true);
    expect(groupsServiceMock.checkIfUserIsOwner).toHaveBeenCalledWith(
      "group-id",
      "owner-id",
    );
  });

  it("should reject the request when the user does not own the group", async () => {
    groupsServiceMock.checkIfUserIsOwner.mockRejectedValueOnce(
      new ForbiddenException("User is not the owner of the group"),
    );

    await expect(
      sut.canActivate(
        makeContext({ groupId: "group-id" }, "someone-else-id"),
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
