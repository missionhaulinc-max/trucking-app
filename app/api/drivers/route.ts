import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

// GET ALL DRIVERS
export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(drivers);
  } catch (error) {
    console.error("GET DRIVERS ERROR:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// CREATE DRIVER
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const driver = await prisma.driver.create({
      data: {
        name: body.name,
        phone: body.phone || null,
        address: body.address || null,
        driverType: body.driverType || "company",
      },
    });

    return NextResponse.json(driver);
  } catch (error) {
    console.error("CREATE DRIVER ERROR:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}