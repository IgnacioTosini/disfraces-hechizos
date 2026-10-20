import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function todayInArgentina() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(value("year"), value("month") - 1, value("day")));
}

export async function getAdminDashboardData() {
  const today = todayInArgentina();
  const horizon = new Date(today);
  horizon.setUTCDate(horizon.getUTCDate() + 3);

  const [costumes, activeCostumes, categories, pending, recentRequests, inspectionRequests, upcomingReturns, inspectionCounts] = await Promise.all([
    prisma.costume.count(),
    prisma.costume.count({ where: { isActive: true } }),
    prisma.category.count(),
    prisma.rentalRequest.count({ where: { status: "PENDING" } }),
    prisma.rentalRequest.findMany({ take: 6, orderBy: { createdAt: "desc" }, include: { customer: true, items: true } }),
    getInspectionRequests(),
    prisma.rentalRequest.findMany({
      where: { status: "PICKED_UP", items: { some: { returnDate: { gte: today, lte: horizon } } } },
      orderBy: { returnDate: "asc" },
      take: 5,
      include: {
        customer: { select: { name: true } },
        items: {
          where: { returnDate: { gte: today, lte: horizon } },
          select: { costumeName: true, size: true, quantity: true, returnDate: true },
        },
      },
    }),
    prisma.rentalRequest.count({ where: { status: "RETURNED", items: { some: { isAvailableAgain: false } } } }),
  ]);

  return {
    stats: { costumes, activeCostumes, categories, pending, awaitingInspection: inspectionCounts },
    recentRequests,
    inspectionRequests,
    upcomingReturns,
  };
}

async function getInspectionRequests() {
  const requests = await prisma.rentalRequest.findMany({
    where: { status: "RETURNED", items: { some: { isAvailableAgain: false } } },
    orderBy: { returnDate: "asc" },
    take: 8,
    include: {
      customer: { select: { name: true } },
      items: {
        where: { isAvailableAgain: false },
        select: { id: true, costumeName: true, size: true, quantity: true },
      },
    },
  });
  if (!requests.length) return [];

  const itemIds = requests.flatMap((request) => request.items.map((item) => item.id));
  const releaseStates = await prisma.$queryRaw<{ id: string; isAvailableAgain: boolean }[]>`
    SELECT "id", "isAvailableAgain" FROM "RentalItem" WHERE "id" IN (${Prisma.join(itemIds)})
  `;
  const releaseById = new Map(releaseStates.map(({ id, isAvailableAgain }) => [id, isAvailableAgain]));
  return requests.map((request) => ({
    ...request,
    items: request.items.map((item) => ({ ...item, isAvailableAgain: releaseById.get(item.id) ?? false })),
  }));
}
