import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import {
  PrismaClient,
  FrequencyType,
  GroupMemberType,
  Position,
  Rank,
  Weekday,
} from "../generated/prisma/client";

const OWNER_EMAIL = "renan@gmail.com";
const DEMO_PASSWORD = "123456";
const DEMO_GROUP_NAMES = ["Pelada de Sexta", "Pelada Mensal"];
const BRAZIL_UTC_OFFSET_HOURS = 3;
const TEAM_COLORS = ["#FFFFFF", "#000000"];

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

function nextWeekday(from: Date, weekday: number): Date {
  const result = new Date(from);
  result.setUTCHours(0, 0, 0, 0);
  const diff = (weekday - result.getUTCDay() + 7) % 7;
  result.setUTCDate(
    result.getUTCDate() + (diff === 0 ? 7 : diff),
  );
  return result;
}

function atBrazilTime(
  date: Date,
  hour: number,
  minute: number,
): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hour + BRAZIL_UTC_OFFSET_HOURS,
      minute,
      0,
    ),
  );
}

const DEMO_PLAYERS: {
  name: string;
  position: Position;
  rank: Rank;
  type: GroupMemberType;
}[] = [
  {
    name: "Lucas Andrade",
    position: Position.GOALKEEPER,
    rank: Rank.BRASILEIRAO,
    type: GroupMemberType.MONTHLY,
  },
  {
    name: "Vitor Lima",
    position: Position.GOALKEEPER,
    rank: Rank.CHAMPIONS_LEAGUE,
    type: GroupMemberType.DAILY,
  },
  {
    name: "Pedro Silva",
    position: Position.DEFENDER,
    rank: Rank.CHAMPIONS_LEAGUE,
    type: GroupMemberType.MONTHLY,
  },
  {
    name: "Gabriel Souza",
    position: Position.DEFENDER,
    rank: Rank.BRASILEIRAO,
    type: GroupMemberType.MONTHLY,
  },
  {
    name: "Rafael Costa",
    position: Position.WINGER,
    rank: Rank.BALLON_DOR,
    type: GroupMemberType.MONTHLY,
  },
  {
    name: "Bruno Alves",
    position: Position.WINGER,
    rank: Rank.CHAMPIONS_LEAGUE,
    type: GroupMemberType.DAILY,
  },
  {
    name: "Thiago Nunes",
    position: Position.STRIKER,
    rank: Rank.BALLON_DOR,
    type: GroupMemberType.MONTHLY,
  },
  {
    name: "Diego Martins",
    position: Position.STRIKER,
    rank: Rank.BRASILEIRAO,
    type: GroupMemberType.DAILY,
  },
];

const DEMO_GUESTS: {
  name: string;
  position: Position;
  rank: Rank;
}[] = [
  {
    name: "Marcos Vieira",
    position: Position.GOALKEEPER,
    rank: Rank.BRASILEIRAO,
  },
  {
    name: "André Ribeiro",
    position: Position.DEFENDER,
    rank: Rank.CHAMPIONS_LEAGUE,
  },
  {
    name: "Felipe Barros",
    position: Position.STRIKER,
    rank: Rank.BRASILEIRAO,
  },
];

type DemoUser = {
  id: string;
  type: GroupMemberType;
  rank: Rank;
};

async function ensureDemoUsers(): Promise<DemoUser[]> {
  const hashedPassword = await hash(DEMO_PASSWORD, 10);
  const users: DemoUser[] = [];
  for (const [index, player] of DEMO_PLAYERS.entries()) {
    const email = `demo.jogador${index + 1}@futplus.dev`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: player.name,
        position: player.position,
        hashedPassword,
      },
    });
    users.push({
      id: user.id,
      type: player.type,
      rank: player.rank,
    });
  }
  return users;
}

async function resetDemoGroups(ownerId: string) {
  const { count } = await prisma.group.deleteMany({
    where: { ownerId, name: { in: DEMO_GROUP_NAMES } },
  });
  if (count > 0) {
    console.log(
      `${count} grupo(s) de demonstração antigos apagados.`,
    );
  }
}

async function createGroup(params: {
  ownerId: string;
  name: string;
  weekday: Weekday;
  hour: string;
  frequency: FrequencyType;
  valuePerUser: number;
  members: DemoUser[];
}) {
  const { members, ...groupData } = params;
  const group = await prisma.group.create({ data: groupData });
  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: params.ownerId,
      type: GroupMemberType.OWNER,
    },
  });
  for (const member of members) {
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: member.id,
        type: member.type,
        rank: member.rank,
      },
    });
  }
  console.log(`Grupo "${params.name}" criado.`);
  return group;
}

async function addConfirmedGuest(
  groupMatchId: string,
  guest: (typeof DEMO_GUESTS)[number],
) {
  const guestUser = await prisma.guestUser.create({
    data: { groupMatchId, ...guest },
  });
  await prisma.groupMatchPresence.create({
    data: {
      groupMatchId,
      guestUserId: guestUser.id,
      isPresent: true,
    },
  });
  return guestUser;
}

async function seedEventualGroup(
  ownerId: string,
  demoUsers: DemoUser[],
) {
  const group = await createGroup({
    ownerId,
    name: "Pelada de Sexta",
    weekday: Weekday.FRIDAY,
    hour: "20:00",
    frequency: FrequencyType.EVENTUAL,
    valuePerUser: 20,
    members: demoUsers,
  });

  const matchADate = atBrazilTime(
    nextWeekday(new Date(), 5),
    20,
    0,
  );
  const matchA = await prisma.groupMatch.create({
    data: { groupId: group.id, matchDate: matchADate },
  });
  await prisma.groupMatchPresence.create({
    data: {
      groupMatchId: matchA.id,
      userId: ownerId,
      isPresent: true,
    },
  });
  for (const user of demoUsers.slice(0, 5)) {
    await prisma.groupMatchPresence.create({
      data: {
        groupMatchId: matchA.id,
        userId: user.id,
        isPresent: true,
      },
    });
  }
  await prisma.groupMatchPresence.create({
    data: {
      groupMatchId: matchA.id,
      userId: demoUsers[5].id,
      isPresent: false,
    },
  });
  for (const guest of DEMO_GUESTS.slice(0, 2)) {
    await addConfirmedGuest(matchA.id, guest);
  }
  console.log(
    `Partida A (${matchADate.toISOString()}): 8 confirmados (2 convidados), 1 recusou, 2 pendentes, sem times.`,
  );

  const matchBDate = new Date(matchADate);
  matchBDate.setUTCDate(matchBDate.getUTCDate() + 7);
  const matchB = await prisma.groupMatch.create({
    data: { groupId: group.id, matchDate: matchBDate },
  });
  const confirmedUserIds = [
    ownerId,
    ...demoUsers.map((u) => u.id),
  ];
  for (const userId of confirmedUserIds) {
    await prisma.groupMatchPresence.create({
      data: { groupMatchId: matchB.id, userId, isPresent: true },
    });
  }
  const guestIds: string[] = [];
  for (const guest of DEMO_GUESTS) {
    const guestUser = await addConfirmedGuest(matchB.id, guest);
    guestIds.push(guestUser.id);
  }

  const teams = await Promise.all(
    TEAM_COLORS.map((color, index) =>
      prisma.matchTeam.create({
        data: {
          groupMatchId: matchB.id,
          name: `Time ${index + 1}`,
          color,
        },
      }),
    ),
  );
  const players = [
    ...confirmedUserIds.map((userId) => ({ userId })),
    ...guestIds.map((guestUserId) => ({ guestUserId })),
  ];
  await Promise.all(
    players.map((player, index) =>
      prisma.matchTeamPlayer.create({
        data: {
          matchTeamId: teams[index % teams.length].id,
          groupMatchId: matchB.id,
          ...player,
        },
      }),
    ),
  );
  console.log(
    `Partida B (${matchBDate.toISOString()}): todos confirmados (3 convidados), times já gerados.`,
  );
}

async function seedMonthlyGroup(
  ownerId: string,
  demoUsers: DemoUser[],
) {
  await createGroup({
    ownerId,
    name: "Pelada Mensal",
    weekday: Weekday.MONDAY,
    hour: "19:00",
    frequency: FrequencyType.MONTHLY,
    valuePerUser: 25,
    members: demoUsers.slice(0, 4),
  });
  console.log(
    "Grupo mensal sem partidas (elas são geradas pelo cron automaticamente).",
  );
}

async function main() {
  const owner = await prisma.user.findUnique({
    where: { email: OWNER_EMAIL },
  });
  if (!owner) {
    console.error(
      `Nenhum usuário encontrado com o email ${OWNER_EMAIL}. Crie a conta pelo app (signup) e rode o seed de novo.`,
    );
    process.exitCode = 1;
    return;
  }

  const demoUsers = await ensureDemoUsers();
  await resetDemoGroups(owner.id);
  await seedEventualGroup(owner.id, demoUsers);
  await seedMonthlyGroup(owner.id, demoUsers);

  console.log(
    `Seed concluído. Contas de demonstração: demo.jogador1..${DEMO_PLAYERS.length}@futplus.dev (senha ${DEMO_PASSWORD}).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
