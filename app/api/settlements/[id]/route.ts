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

    const settlement = await prisma.settlement.findUnique({
      where: { id },
    });

    if (!settlement) {
      return Response.json({ error: "Settlement not found" }, { status: 404 });
    }

    return Response.json(settlement);
  } catch (error: any) {
    console.error("GET SETTLEMENT ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to fetch settlement" },
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

    const updatedSettlement = await prisma.settlement.update({
      where: { id },
      data: {
        driverName: body.driverName ? String(body.driverName) : undefined,
        driverType:
          body.driverType !== undefined
            ? String(body.driverType || "")
            : undefined,
        paystubId:
          body.paystubId !== undefined
            ? String(body.paystubId || "")
            : undefined,
        payDate: body.payDate ? new Date(body.payDate) : undefined,
        weekStart: body.weekStart ? new Date(body.weekStart) : undefined,
        weekEnd: body.weekEnd ? new Date(body.weekEnd) : undefined,
        grossAmount:
          body.grossAmount !== undefined && body.grossAmount !== ""
            ? Number(body.grossAmount)
            : undefined,
        totalMiles:
          body.totalMiles !== undefined && body.totalMiles !== ""
            ? Number(body.totalMiles)
            : undefined,
        loadDetails:
          body.loadDetails !== undefined
            ? String(body.loadDetails || "")
            : undefined,
        totalExpense:
          body.totalExpense !== undefined && body.totalExpense !== ""
            ? Number(body.totalExpense)
            : undefined,
        dispatchFee:
          body.dispatchFee !== undefined && body.dispatchFee !== ""
            ? Number(body.dispatchFee)
            : undefined,
        netAmount:
          body.netAmount !== undefined && body.netAmount !== ""
            ? Number(body.netAmount)
            : undefined,
      },
    });

    return Response.json(updatedSettlement);
  } catch (error: any) {
    console.error("UPDATE SETTLEMENT ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to update settlement" },
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

    await prisma.settlement.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("DELETE SETTLEMENT ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to delete settlement" },
      { status: 500 }
    );
  }
}