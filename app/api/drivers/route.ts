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
    const drivers = await prisma.driver.findMany({
      orderBy: { createdAt: "desc" },
    });

    return Response.json(drivers);
  } catch (error: any) {
    console.error("GET DRIVERS ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to fetch drivers" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.driverType) {
      return Response.json(
        { error: "Driver name and driver type are required" },
        { status: 400 }
      );
    }

    const newDriver = await prisma.driver.create({
      data: {
        name: String(body.name),
        phone: body.phone ? String(body.phone) : "",
        address: body.address ? String(body.address) : "",
        ssnLast4: body.ssnLast4 ? String(body.ssnLast4) : "",
        truck: body.truck ? String(body.truck) : "",
        driverType: String(body.driverType),
      },
    });

    return Response.json(newDriver);
  } catch (error: any) {
    console.error("POST DRIVER ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to create driver" },
      { status: 500 }
    );
  }
}