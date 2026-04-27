import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("GET EXPENSES ERROR:", error);
    return NextResponse.json({ error: "Failed to get expenses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const expense = await prisma.expense.create({
      data: {
        date: body.date ? new Date(body.date) : new Date(),
        category: String(body.category || "Other"),
        amount: Number(body.amount || 0),
        description: body.description ? String(body.description) : null,
        driverId: body.driverId ? String(body.driverId) : null,
        vehicleId: body.vehicleId ? String(body.vehicleId) : null,
        loadId: body.loadId ? String(body.loadId) : null,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("CREATE EXPENSE ERROR:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}