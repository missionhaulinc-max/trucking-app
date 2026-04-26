import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const role = String(body.role || "driver").trim();
    const driverId = body.driverId ? String(body.driverId) : null;
    const driverName = body.driverName ? String(body.driverName) : null;

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: "Username, password, and role required" },
        { status: 400 }
      );
    }

    const exists = await (prisma as any).user.findUnique({
      where: { username },
    });

    if (exists) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await (prisma as any).user.create({
      data: {
        username,
        password: hashedPassword,
        role,
        driverId,
        driverName,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        driverId: user.driverId,
        driverName: user.driverName,
      },
    });
  } catch (error: any) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "Register failed" },
      { status: 500 }
    );
  }
}