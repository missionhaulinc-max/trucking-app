export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function GET() {
  try {
    const settlements = await prisma.settlement.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(settlements);
  } catch (error: any) {
    console.error("GET SETTLEMENTS ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to fetch settlements" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.driverName || !body.weekStart || !body.weekEnd) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🔥 AUTO FETCH DATA FROM DATABASE
const loads = await prisma.load.findMany({
  where: {
    driverId: body.driverId,
  },
});

const expenses = await prisma.expense.findMany({
  where: {
    driver: body.driverName,
  },
});

// 🔥 CALCULATIONS
const grossAmount = loads.reduce((sum, l) => sum + (l.rate || 0), 0);
const totalMiles = loads.reduce((sum, l) => sum + (l.totalMiles || 0), 0);
const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

// Owner operator logic
const dispatchFee =
  body.driverType === "Owner Operator" ? grossAmount * 0.1 : 0;

const netAmount = grossAmount - totalExpense - dispatchFee;

// 🔥 CREATE SETTLEMENT
const settlement = await prisma.settlement.create({
  data: {
    driverName: String(body.driverName),
    driverId: String(body.driverId),
    driverType: body.driverType || "Company Driver",

    paystubId: `PAY-${Date.now()}`,
    payDate: new Date(),

    weekStart: new Date(body.weekStart),
    weekEnd: new Date(body.weekEnd),

    grossAmount,
    totalMiles,
    totalExpense,
    dispatchFee,
    netAmount,

    loadDetails: JSON.stringify(loads),
    expenseDetails: JSON.stringify(expenses),
  },
});

    return Response.json(settlement);
  } catch (error: any) {
    console.error("CREATE SETTLEMENT ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to create settlement" },
      { status: 500 }
    );
  }
}