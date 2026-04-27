import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(drivers);
  } catch (error) {
    console.error("GET DRIVERS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to get drivers" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const driver = await prisma.driver.create({
      data: {
        name: String(body.name || ""),
        phone: body.phone ? String(body.phone) : null,
        address: body.address ? String(body.address) : null,
        ssnLast4: body.ssnLast4 ? String(body.ssnLast4) : null,
        truck: body.truck ? String(body.truck) : null,
        driverType: String(body.driverType || "company"),
      },
    });

    return NextResponse.json(driver);
  } catch (error) {
    console.error("CREATE DRIVER ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create driver" },
      { status: 500 }
    );
  }
}