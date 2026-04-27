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
    const vehicles = await prisma.vehicle.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(vehicles);
  } catch (error: any) {
    console.error("GET VEHICLES ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (
      !body.company ||
      !body.make ||
      !body.model ||
      !body.kind ||
      !body.vinNumber ||
      !body.unitNumber ||
      !body.licensePlate ||
      !body.ownershipType
    ) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        company: String(body.company),
        make: String(body.make),
        model: String(body.model),
        kind: String(body.kind),
        vinNumber: String(body.vinNumber),
        unitNumber: String(body.unitNumber),
        licensePlate: String(body.licensePlate),
        assignedDriver: body.assignedDriver
          ? String(body.assignedDriver)
          : null,
        ownershipType: String(body.ownershipType),
      },
    });

    return Response.json(vehicle);
  } catch (error: any) {
    console.error("CREATE VEHICLE ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to create vehicle" },
      { status: 500 }
    );
  }
}