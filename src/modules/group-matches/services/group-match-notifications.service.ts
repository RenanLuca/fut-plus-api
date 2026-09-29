import { Inject, Injectable, Logger } from "@nestjs/common";
import { env } from "@src/shared/config/env";
import { GROUP_MEMBERS_REPOSITORY } from "@src/shared/database/interfaces/group-members.repository.interface";
import type { IGroupMembersRepository } from "@src/shared/database/interfaces/group-members.repository.interface";
import { GROUPS_REPOSITORY } from "@src/shared/database/interfaces/groups.repository.interface";
import type { IGroupsRepository } from "@src/shared/database/interfaces/groups.repository.interface";
import { MAIL_SERVICE } from "@src/modules/mail/interfaces/mail.service.interface";
import type { IMailService } from "@src/modules/mail/interfaces/mail.service.interface";
import { matchOpenedTemplate } from "@src/modules/mail/templates/match-opened.template";

@Injectable()
export class GroupMatchNotificationsService {
  private readonly logger = new Logger(
    GroupMatchNotificationsService.name,
  );

  constructor(
    @Inject(GROUP_MEMBERS_REPOSITORY)
    private readonly groupMembersRepository: IGroupMembersRepository,
    @Inject(GROUPS_REPOSITORY)
    private readonly groupsRepository: IGroupsRepository,
    @Inject(MAIL_SERVICE)
    private readonly mailService: IMailService,
  ) {}

  /**
   * Emails every group member who has a verified address and hasn't
   * turned notifications off. Guests have no account, so they have no
   * email and are naturally left out (only `userId` members are queried).
   * Never rejects: a failure here must not break match creation.
   */
  async notifyMatchOpened({
    groupId,
    matchDate,
  }: {
    groupId: string;
    matchDate: Date;
  }): Promise<void> {
    try {
      const [group, members] = await Promise.all([
        this.groupsRepository.findNameById(groupId),
        this.groupMembersRepository.findAllByGroupIdWithNotificationFilters(
          groupId,
        ),
      ]);
      if (!group || members.length === 0) {
        return;
      }

      await this.mailService.sendBatch(
        members
          .filter((m) => m.user)
          .map(({ user }) => ({
            to: user.email,
            ...matchOpenedTemplate({
              name: user.name,
              groupName: group.name,
              matchDate,
              url: `${env.frontendUrl}/groups/${groupId}`,
            }),
          })),
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify members of new match in group ${groupId}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
