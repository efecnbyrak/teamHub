import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId } },
  });
  if (!membership) return NextResponse.json({ error: 'Bu projeye erişim yetkiniz yok' }, { status: 403 });

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, avatar: true } },
      members: {
        include: { user: { select: { id: true, name: true, avatar: true, xp: true, level: true } } },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return NextResponse.json({ project });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;
  const { name, description } = await req.json() as { name?: string; description?: string };

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.ownerId !== userId) {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
  }

  const updated = await prisma.project.update({ where: { id }, data: { name, description } });
  return NextResponse.json({ project: updated });
}
