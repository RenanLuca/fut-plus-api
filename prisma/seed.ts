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

const OWNER_EMAIL = "renandelucamachado32@gmail.com";
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

type PlayerSeed = {
  name: string;
  position: Position;
  rank: Rank;
  type: GroupMemberType;
};

// Núcleo balanceado: 1 goleiro aqui + o dono (goleiro na conta real,
// fora do controle do seed) = 2 goleiros no total; 2 de cada posição de
// linha. É este grupo que fica "todos confirmados" na Partida B, usado
// pra demonstrar geração de times — por isso precisa ficar equilibrado.
const DEMO_PLAYERS: PlayerSeed[] = [
  {
    name: "Lucas Andrade",
    position: Position.GOALKEEPER,
    rank: Rank.BRASILEIRAO,
    type: GroupMemberType.MONTHLY,
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

// Só aparecem pendentes/recusados na Partida A, pra dar variedade à tela
// de presença — não entram no roster balanceado acima nem na Partida B
// ("todos confirmados").
const DEMO_EXTRA_PLAYERS: PlayerSeed[] = [
  {
    name: "Vitor Lima",
    position: Position.DEFENDER,
    rank: Rank.CHAMPIONS_LEAGUE,
    type: GroupMemberType.DAILY,
  },
  {
    name: "Igor Martins",
    position: Position.STRIKER,
    rank: Rank.BRASILEIRAO,
    type: GroupMemberType.DAILY,
  },
  {
    name: "Caio Ferreira",
    position: Position.DEFENDER,
    rank: Rank.CHAMPIONS_LEAGUE,
    type: GroupMemberType.MONTHLY,
  },
];

const DEMO_GUESTS: {
  name: string;
  position: Position;
  rank: Rank;
}[] = [
  {
    name: "Marcos Vieira",
    position: Position.WINGER,
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

function brazilCurrentMonthStart(): Date {
  const brazilNow = new Date(
    Date.now() - BRAZIL_UTC_OFFSET_HOURS * 60 * 60 * 1000,
  );
  return new Date(
    Date.UTC(
      brazilNow.getUTCFullYear(),
      brazilNow.getUTCMonth(),
      1,
    ),
  );
}

async function addMonthlyPayment(
  groupId: string,
  userId: string,
  amount: number,
) {
  await prisma.groupPayment.create({
    data: {
      groupId,
      userId,
      amount,
      period: brazilCurrentMonthStart(),
    },
  });
}

type DemoUser = {
  id: string;
  name: string;
  type: GroupMemberType;
  rank: Rank;
};

async function ensureDemoUsers(): Promise<DemoUser[]> {
  const hashedPassword = await hash(DEMO_PASSWORD, 10);
  const allPlayers = [...DEMO_PLAYERS, ...DEMO_EXTRA_PLAYERS];
  const users: DemoUser[] = [];
  for (const [index, player] of allPlayers.entries()) {
    const email = `demo.jogador${index + 1}@futplus.dev`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: player.name,
        position: player.position,
        emailVerifiedAt: new Date(),
      },
      create: {
        email,
        name: player.name,
        position: player.position,
        hashedPassword,
        emailVerifiedAt: new Date(),
      },
    });
    users.push({
      id: user.id,
      name: player.name,
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
  coreUsers: DemoUser[],
  extraUsers: DemoUser[],
) {
  const group = await createGroup({
    ownerId,
    name: "Pelada de Sexta",
    weekday: Weekday.FRIDAY,
    hour: "20:00",
    frequency: FrequencyType.EVENTUAL,
    valuePerUser: 20,
    members: [...coreUsers, ...extraUsers],
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
  for (const user of coreUsers.slice(0, 5)) {
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
      userId: coreUsers[5].id,
      isPresent: false,
    },
  });
  // coreUsers[6] fica pendente (sem registro de presença).
  await prisma.groupMatchPresence.create({
    data: {
      groupMatchId: matchA.id,
      userId: extraUsers[0].id,
      isPresent: false,
    },
  });
  // extraUsers[1] e extraUsers[2] ficam pendentes (sem registro).
  for (const guest of DEMO_GUESTS.slice(0, 2)) {
    await addConfirmedGuest(matchA.id, guest);
  }
  console.log(
    `Partida A (${matchADate.toISOString()}): 8 confirmados (2 convidados), 2 recusaram, 3 pendentes, sem times.`,
  );

  const matchBDate = new Date(matchADate);
  matchBDate.setUTCDate(matchBDate.getUTCDate() + 7);
  const matchB = await prisma.groupMatch.create({
    data: { groupId: group.id, matchDate: matchBDate },
  });
  const confirmedUserIds = [
    ownerId,
    ...coreUsers.map((u) => u.id),
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
    `Partida B (${matchBDate.toISOString()}): todos confirmados (núcleo balanceado + 3 convidados), times já gerados. Os 3 jogadores extras (pendentes/recusados na Partida A) não entram aqui.`,
  );

  await seedPastMatchesAndPayments(group.id, matchADate, [
    ...coreUsers,
    ...extraUsers,
  ]);
}

async function seedPastMatchesAndPayments(
  groupId: string,
  matchADate: Date,
  allUsers: DemoUser[],
) {
  const byName = (name: string): DemoUser => {
    const user = allUsers.find((u) => u.name === name);
    if (!user) {
      throw new Error(
        `Demo player "${name}" not found in seed data`,
      );
    }
    return user;
  };
  const lucas = byName("Lucas Andrade");
  const vitor = byName("Vitor Lima");
  const pedro = byName("Pedro Silva");
  const gabriel = byName("Gabriel Souza");
  const bruno = byName("Bruno Alves");
  const diego = byName("Diego Martins");

  const pastMatchDate = new Date(matchADate);
  pastMatchDate.setUTCDate(pastMatchDate.getUTCDate() - 14);
  const olderMatchDate = new Date(matchADate);
  olderMatchDate.setUTCDate(olderMatchDate.getUTCDate() - 21);

  const pastMatch = await prisma.groupMatch.create({
    data: { groupId, matchDate: pastMatchDate },
  });
  const olderMatch = await prisma.groupMatch.create({
    data: { groupId, matchDate: olderMatchDate },
  });
  for (const user of [vitor, bruno, diego]) {
    await prisma.groupMatchPresence.create({
      data: {
        groupMatchId: pastMatch.id,
        userId: user.id,
        isPresent: true,
      },
    });
  }
  for (const user of [bruno, diego]) {
    await prisma.groupMatchPresence.create({
      data: {
        groupMatchId: olderMatch.id,
        userId: user.id,
        isPresent: true,
      },
    });
  }

  await addMonthlyPayment(groupId, lucas.id, 20);
  await addMonthlyPayment(groupId, pedro.id, 20);
  await addMonthlyPayment(groupId, gabriel.id, 15);
  await prisma.groupPayment.create({
    data: {
      groupId,
      userId: vitor.id,
      matchId: pastMatch.id,
      amount: 20,
      period: pastMatchDate,
    },
  });
  console.log(
    "Pagamentos demo: 3 mensalidades do mês pagas (Lucas, Pedro, Gabriel), 1 por partida (Vitor); Bruno e Diego têm 2 partidas passadas pendentes; o dono não pagou a mensalidade.",
  );
}

async function seedMonthlyGroup(
  ownerId: string,
  coreUsers: DemoUser[],
) {
  const group = await createGroup({
    ownerId,
    name: "Pelada Mensal",
    weekday: Weekday.MONDAY,
    hour: "19:00",
    frequency: FrequencyType.MONTHLY,
    valuePerUser: 25,
    members: coreUsers.slice(0, 4),
  });
  await addMonthlyPayment(group.id, coreUsers[0].id, 25);
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

  if (!owner.emailVerifiedAt) {
    await prisma.user.update({
      where: { id: owner.id },
      data: { emailVerifiedAt: new Date() },
    });
  }

  const demoUsers = await ensureDemoUsers();
  const coreUsers = demoUsers.slice(0, DEMO_PLAYERS.length);
  const extraUsers = demoUsers.slice(DEMO_PLAYERS.length);

  await resetDemoGroups(owner.id);
  await seedEventualGroup(owner.id, coreUsers, extraUsers);
  await seedMonthlyGroup(owner.id, coreUsers);

  console.log(
    `Seed concluído. Contas de demonstração: demo.jogador1..${demoUsers.length}@futplus.dev (senha ${DEMO_PASSWORD}).`,
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
