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
    const loads = await prisma.load.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const drivers = await prisma.driver.findMany();

    const formatted = loads.map((load) => {
      const matchedDriver = drivers.find((d) => d.id === load.driverId);

      return {
        ...load,
        driver: matchedDriver?.name || "",
      };
    });

    return Response.json(formatted);
  } catch (error: any) {
    console.error("GET LOADS ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to fetch loads" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (
      !body.loadNumber ||
      !body.broker ||
      !body.pickupLocation ||
      !body.deliveryLocation ||
      !body.pickupDate ||
      !body.deliveryDate
    ) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const createdLoad = await prisma.load.create({
      data: {
        loadNumber: String(body.loadNumber),
        broker: String(body.broker),
        pickupLocation: String(body.pickupLocation),
        deliveryLocation: String(body.deliveryLocation),
        pickupDate: new Date(body.pickupDate),
        deliveryDate: new Date(body.deliveryDate),
        status: body.status ? String(body.status) : "Pending",
        rate: Number(body.rate || 0),
        truck: body.truck ? String(body.truck) : null,
        totalMiles: body.totalMiles ? Number(body.totalMiles) : null,
        driverId: body.driverId ? String(body.driverId) : null,
      },
    });

    const matchedDriver = createdLoad.driverId
      ? await prisma.driver.findUnique({
          where: { id: createdLoad.driverId },
        })
      : null;

    return Response.json({
      ...createdLoad,
      driver: matchedDriver?.name || "",
    });
  } catch (error: any) {
    console.error("CREATE LOAD ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to create load" },
      { status: 500 }
    );
  }
}