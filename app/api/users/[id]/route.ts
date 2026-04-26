import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    await (prisma as any).user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE USER ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "Delete failed" },
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

    const data: any = {
      username: String(body.username || "").trim(),
      role: String(body.role || "driver"),
      driverName: body.driverName ? String(body.driverName) : null,
    };

    if (body.password) {
      data.password = await bcrypt.hash(String(body.password), 10);
    }

    const user = await (prisma as any).user.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("UPDATE USER ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "Update failed" },
      { status: 500 }
    );
  }
}