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

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return Response.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return Response.json(vehicle);
  } catch (error: any) {
    console.error("GET VEHICLE ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to fetch vehicle" },
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

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        company: body.company ? String(body.company) : undefined,
        make: body.make ? String(body.make) : undefined,
        model: body.model ? String(body.model) : undefined,
        kind: body.kind ? String(body.kind) : undefined,
        vinNumber: body.vinNumber ? String(body.vinNumber) : undefined,
        unitNumber: body.unitNumber ? String(body.unitNumber) : undefined,
        licensePlate: body.licensePlate ? String(body.licensePlate) : undefined,
        assignedDriver:
          body.assignedDriver !== undefined
            ? String(body.assignedDriver || "")
            : undefined,
        ownershipType: body.ownershipType
          ? String(body.ownershipType)
          : undefined,
      },
    });

    return Response.json(updatedVehicle);
  } catch (error: any) {
    console.error("UPDATE VEHICLE ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to update vehicle" },
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

    await prisma.vehicle.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("DELETE VEHICLE ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to delete vehicle" },
      { status: 500 }
    );
  }
}