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
    const expenses = await prisma.expense.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(expenses);
  } catch (error: any) {
    console.error("GET EXPENSES ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.category || body.amount === undefined || body.amount === "") {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        category: String(body.category),
        amount: Number(body.amount),
        date: body.date ? new Date(body.date) : new Date(),
        driver: body.driver ? String(body.driver) : null,
        truck: body.truck ? String(body.truck) : null,
        notes: body.notes ? String(body.notes) : null,
      },
    });

    return Response.json(expense);
  } catch (error: any) {
    console.error("CREATE EXPENSE ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to create expense" },
      { status: 500 }
    );
  }
}