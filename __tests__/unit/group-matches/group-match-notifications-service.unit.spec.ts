import { mock } from "vitest-mock-extended";
import type { IGroupMembersRepository } from "@src/shared/database/interfaces/group-members.repository.interface";
import type { IGroupsRepository } from "@src/shared/database/interfaces/groups.repository.interface";
import type { IMailService } from "@src/modules/mail/interfaces/mail.service.interface";
import { describe, it, expect, beforeEach } from "vitest";
import { GroupMatchNotificationsService } from "@src/modules/group-matches/services/group-match-notifications.service";
import { makeMemberWithNotificationEmailMock } from "../../utils/groups";

const groupMembersRepoMock = mock<IGroupMembersRepository>();
const groupsRepoMock = mock<IGroupsRepository>();
const mailServiceMock = mock<IMailService>();

const member = makeMemberWithNotificationEmailMock();

let sut: GroupMatchNotificationsService;
beforeEach(() => {
  sut = new GroupMatchNotificationsService(
    groupMembersRepoMock,
    groupsRepoMock,
    mailServiceMock,
  );
  groupsRepoMock.findNameById.mockResolvedValue({
    name: "Pelada de Sexta",
  });
  groupMembersRepoMock.findAllByGroupIdWithNotificationFilters.mockResolvedValue(
    [member],
  );
});

describe("GroupMatchNotificationsService", () => {
  describe("notifyMatchOpened", () => {
    it("should send a batch email to every eligible member", async () => {
      const matchDate = new Date();

      await sut.notifyMatchOpened({ groupId: "group-id", matchDate });

      expect(mailServiceMock.sendBatch).toHaveBeenCalledWith([
        expect.objectContaining({ to: member.user.email }),
      ]);
    });

    it("should not send anything if the group does not exist", async () => {
      groupsRepoMock.findNameById.mockResolvedValueOnce(null);

      await sut.notifyMatchOpened({
        groupId: "group-id",
        matchDate: new Date(),
      });

      expect(mailServiceMock.sendBatch).not.toHaveBeenCalled();
    });

    it("should not send anything if there are no eligible members", async () => {
      groupMembersRepoMock.findAllByGroupIdWithNotificationFilters.mockResolvedValueOnce(
        [],
      );

      await sut.notifyMatchOpened({
        groupId: "group-id",
        matchDate: new Date(),
      });

      expect(mailServiceMock.sendBatch).not.toHaveBeenCalled();
    });

    it("should never reject even if sending the email fails", async () => {
      mailServiceMock.sendBatch.mockRejectedValueOnce(
        new Error("Resend is down"),
      );

      const promiseResult = sut.notifyMatchOpened({
        groupId: "group-id",
        matchDate: new Date(),
      });

      await expect(promiseResult).resolves.toBeUndefined();
    });
  });
});
