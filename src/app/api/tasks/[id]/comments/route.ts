import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId, unauthorized } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params;
  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id: taskId } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "İçerik boş olamaz" }, { status: 400 });

  const comment = await prisma.comment.create({
    data: { taskId, userId, content: content.trim() },
    include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
  });
  return NextResponse.json({ comment }, { status: 201 });
}
