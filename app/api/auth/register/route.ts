import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

    const exists = await prisma.user.findUnique({
      where: { username },
    });

    if (exists) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
        driverId,
        driverName,
      },
    });

    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: user.role,
      driverId: user.driverId,
      driverName: user.driverName,
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Register failed" },
      { status: 500 }
    );
  }
}