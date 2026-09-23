import { Injectable, Logger } from "@nestjs/common";
import { env } from "@src/shared/config/env";
import { GroupMembersRepository } from "@src/shared/database/repositories/group-members.repository";
import { GroupsRepository } from "@src/shared/database/repositories/groups.repository";
import { MailService } from "@src/modules/mail/mail.service";
import { matchOpenedTemplate } from "@src/modules/mail/templates/match-opened.template";

@Injectable()
export class GroupMatchNotificationsService {
  private readonly logger = new Logger(
    GroupMatchNotificationsService.name,
  );

  constructor(
    private readonly groupMembersRepository: GroupMembersRepository,
    private readonly groupsRepository: GroupsRepository,
    private readonly mailService: MailService,
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
        this.groupsRepository.findUnique({
          where: { id: groupId },
          select: { name: true },
        }),
        this.groupMembersRepository.findMany({
          where: {
            groupId,
            user: {
              emailNotifications: true,
              emailVerifiedAt: { not: null },
            },
          },
          select: {
            user: { select: { name: true, email: true } },
          },
        }),
      ]);
      if (!group || members.length === 0) {
        return;
      }

      await this.mailService.sendBatch(
        members.map(({ user }) => ({
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
