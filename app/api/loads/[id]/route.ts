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

    const load = await prisma.load.findUnique({
      where: { id },
    });

    if (!load) {
      return Response.json({ error: "Load not found" }, { status: 404 });
    }

    const matchedDriver = load.driverId
      ? await prisma.driver.findUnique({
          where: { id: load.driverId },
        })
      : null;

    return Response.json({
      ...load,
      driver: matchedDriver?.name || "",
    });
  } catch (error: any) {
    console.error("GET LOAD ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to fetch load" },
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

    const updatedLoad = await prisma.load.update({
      where: { id },
      data: {
        loadNumber: body.loadNumber ? String(body.loadNumber) : undefined,
        broker: body.broker ? String(body.broker) : undefined,
        pickupLocation: body.pickupLocation
          ? String(body.pickupLocation)
          : undefined,
        deliveryLocation: body.deliveryLocation
          ? String(body.deliveryLocation)
          : undefined,
        pickupDate: body.pickupDate ? new Date(body.pickupDate) : undefined,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
        status: body.status ? String(body.status) : undefined,
        rate: body.rate !== undefined ? Number(body.rate) : undefined,
        truck: body.truck !== undefined ? String(body.truck || "") : undefined,
        totalMiles:
          body.totalMiles !== undefined && body.totalMiles !== ""
            ? Number(body.totalMiles)
            : undefined,
        driverId:
          body.driverId !== undefined
            ? body.driverId
              ? String(body.driverId)
              : null
            : undefined,
      },
    });

    const matchedDriver = updatedLoad.driverId
      ? await prisma.driver.findUnique({
          where: { id: updatedLoad.driverId },
        })
      : null;

    return Response.json({
      ...updatedLoad,
      driver: matchedDriver?.name || "",
    });
  } catch (error: any) {
    console.error("UPDATE LOAD ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to update load" },
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

    await prisma.load.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("DELETE LOAD ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to delete load" },
      { status: 500 }
    );
  }
}