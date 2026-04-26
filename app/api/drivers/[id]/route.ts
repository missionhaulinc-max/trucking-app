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

    const driver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      return Response.json({ error: "Driver not found" }, { status: 404 });
    }

    return Response.json(driver);
  } catch (error: any) {
    console.error("GET DRIVER ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to fetch driver" },
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

    if (!body.name) {
      return Response.json(
        { error: "Driver name is required" },
        { status: 400 }
      );
    }

    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: {
        name: String(body.name),
        phone: body.phone ? String(body.phone) : null,
        address: body.address ? String(body.address) : null,
        ssnLast4: body.ssnLast4 ? String(body.ssnLast4) : null,
        truck: body.truck ? String(body.truck) : null,
        driverType: body.driverType ? String(body.driverType) : "Company Driver",
      },
    });

    return Response.json(updatedDriver);
  } catch (error: any) {
    console.error("UPDATE DRIVER ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to update driver" },
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

    await prisma.driver.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("DELETE DRIVER ERROR:", error);
    return Response.json(
      { error: error?.message || "Failed to delete driver" },
      { status: 500 }
    );
  }
}