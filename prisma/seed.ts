import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  FrequencyType,
  GroupMemberType,
  Position,
  Rank,
  Weekday,
} from "../generated/prisma/client";

const OWNER_EMAIL = "renan@gmail.com";
const BRAZIL_UTC_OFFSET_HOURS = 3;
const TEAM_COLORS = ["#FFFFFF", "#000000", "#FF0000", "#0000FF"];

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

const GUEST_PLAYERS: {
  name: string;
  position: Position;
  rank: Rank;
}[] = [
  {
    name: "Lucas Andrade",
    position: Position.GOALKEEPER,
    rank: Rank.BRASILEIRAO,
  },
  {
    name: "Vitor Lima",
    position: Position.GOALKEEPER,
    rank: Rank.CHAMPIONS_LEAGUE,
  },
  {
    name: "Pedro Silva",
    position: Position.DEFENDER,
    rank: Rank.CHAMPIONS_LEAGUE,
  },
  {
    name: "Gabriel Souza",
    position: Position.DEFENDER,
    rank: Rank.BRASILEIRAO,
  },
  {
    name: "Rafael Costa",
    position: Position.WINGER,
    rank: Rank.BALLON_DOR,
  },
  {
    name: "Bruno Alves",
    position: Position.WINGER,
    rank: Rank.CHAMPIONS_LEAGUE,
  },
  {
    name: "Thiago Nunes",
    position: Position.STRIKER,
    rank: Rank.BALLON_DOR,
  },
  {
    name: "Diego Martins",
    position: Position.STRIKER,
    rank: Rank.BRASILEIRAO,
  },
];

async function findOrCreateGroup(params: {
  ownerId: string;
  name: string;
  weekday: Weekday;
  hour: string;
  frequency: FrequencyType;
  valuePerUser: number;
}) {
  const existing = await prisma.group.findFirst({
    where: { name: params.name, ownerId: params.ownerId },
  });
  if (existing) {
    console.log(
      `Grupo "${params.name}" já existe, reaproveitando.`,
    );
    return { group: existing, created: false };
  }
  const group = await prisma.group.create({
    data: {
      name: params.name,
      ownerId: params.ownerId,
      weekday: params.weekday,
      hour: params.hour,
      frequency: params.frequency,
      valuePerUser: params.valuePerUser,
    },
  });
  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: params.ownerId,
      type: GroupMemberType.OWNER,
    },
  });
  console.log(`Grupo "${params.name}" criado.`);
  return { group, created: true };
}

async function addGuestMembers(groupId: string) {
  const guestIds: string[] = [];
  for (const guest of GUEST_PLAYERS) {
    const guestUser = await prisma.guestUser.create({
      data: { name: guest.name, position: guest.position },
    });
    await prisma.groupMember.create({
      data: {
        groupId,
        guestUserId: guestUser.id,
        type: GroupMemberType.GUEST,
        rank: guest.rank,
      },
    });
    guestIds.push(guestUser.id);
  }
  return guestIds;
}

async function seedEventualGroup(ownerId: string) {
  const { group, created } = await findOrCreateGroup({
    ownerId,
    name: "Pelada de Sexta",
    weekday: Weekday.FRIDAY,
    hour: "20:00",
    frequency: FrequencyType.EVENTUAL,
    valuePerUser: 20,
  });
  if (!created) return;

  const guestIds = await addGuestMembers(group.id);

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
  const [g1, g2, g3, g4, g5, g6] = guestIds;
  for (const guestUserId of [g1, g2, g3, g4, g5]) {
    await prisma.groupMatchPresence.create({
      data: {
        groupMatchId: matchA.id,
        guestUserId,
        isPresent: true,
      },
    });
  }
  await prisma.groupMatchPresence.create({
    data: {
      groupMatchId: matchA.id,
      guestUserId: g6,
      isPresent: false,
    },
  });
  console.log(
    `Partida A (${matchADate.toISOString()}) criada: 6 confirmados, 1 recusado, 2 pendentes, sem times.`,
  );

  const matchBDate = new Date(matchADate);
  matchBDate.setUTCDate(matchBDate.getUTCDate() + 7);
  const matchB = await prisma.groupMatch.create({
    data: { groupId: group.id, matchDate: matchBDate },
  });

  const allConfirmedIds: {
    userId?: string;
    guestUserId?: string;
  }[] = [
    { userId: ownerId },
    ...guestIds.map((guestUserId) => ({ guestUserId })),
  ];
  for (const member of allConfirmedIds) {
    await prisma.groupMatchPresence.create({
      data: {
        groupMatchId: matchB.id,
        ...member,
        isPresent: true,
      },
    });
  }

  const teamA = await prisma.matchTeam.create({
    data: {
      groupMatchId: matchB.id,
      name: "Time 1",
      color: TEAM_COLORS[0],
    },
  });
  const teamB = await prisma.matchTeam.create({
    data: {
      groupMatchId: matchB.id,
      name: "Time 2",
      color: TEAM_COLORS[1],
    },
  });
  await Promise.all(
    allConfirmedIds.map((member, index) =>
      prisma.matchTeamPlayer.create({
        data: {
          matchTeamId: index % 2 === 0 ? teamA.id : teamB.id,
          groupMatchId: matchB.id,
          ...member,
        },
      }),
    ),
  );
  console.log(
    `Partida B (${matchBDate.toISOString()}) criada: todos confirmados, times já gerados.`,
  );
}

async function seedMonthlyGroup(ownerId: string) {
  const { group, created } = await findOrCreateGroup({
    ownerId,
    name: "Pelada Mensal",
    weekday: Weekday.MONDAY,
    hour: "19:00",
    frequency: FrequencyType.MONTHLY,
    valuePerUser: 25,
  });
  if (!created) return;

  for (const guest of GUEST_PLAYERS.slice(0, 4)) {
    const guestUser = await prisma.guestUser.create({
      data: { name: guest.name, position: guest.position },
    });
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        guestUserId: guestUser.id,
        type: GroupMemberType.GUEST,
        rank: guest.rank,
      },
    });
  }
  console.log(
    "Grupo mensal criado sem partidas (elas são geradas pelo cron automaticamente).",
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

  await seedEventualGroup(owner.id);
  await seedMonthlyGroup(owner.id);

  console.log("Seed concluído.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
