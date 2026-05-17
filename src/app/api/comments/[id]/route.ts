import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, unauthorized } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  if (comment.userId !== userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
