import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, unauthorized } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;
  const subtask = await prisma.subtask.findUnique({ where: { id } });
  if (!subtask) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const updated = await prisma.subtask.update({ where: { id }, data: { done: !subtask.done } });
  return NextResponse.json({ subtask: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;
  await prisma.subtask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
