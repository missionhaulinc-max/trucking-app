import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return Response.json({ error: "Expense not found" }, { status: 404 });
    }

    return Response.json(expense);
  } catch (error: any) {
    console.error("GET EXPENSE ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to fetch expense" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        category: body.category ? String(body.category) : undefined,
        amount: body.amount !== undefined ? Number(body.amount) : undefined,
        date: body.date ? new Date(body.date) : undefined,
        driver: body.driver !== undefined ? String(body.driver || "") : undefined,
        truck: body.truck !== undefined ? String(body.truck || "") : undefined,
        notes: body.notes !== undefined ? String(body.notes || "") : undefined,
      },
    });

    return Response.json(updatedExpense);
  } catch (error: any) {
    console.error("UPDATE EXPENSE ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await prisma.expense.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("DELETE EXPENSE ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to delete expense" },
      { status: 500 }
    );
  }
}