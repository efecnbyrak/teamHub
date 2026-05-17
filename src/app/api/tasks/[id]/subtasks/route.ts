import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = await params;
  const subtasks = await prisma.subtask.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ subtasks });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id: taskId } = await params;
  const { title } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Başlık boş olamaz" }, { status: 400 });

  const subtask = await prisma.subtask.create({ data: { taskId, title: title.trim() } });
  return NextResponse.json({ subtask }, { status: 201 });
}
