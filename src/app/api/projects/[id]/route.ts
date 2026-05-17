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
      owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      members: {
        include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true, xp: true, level: true } } },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          creator: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // Kullanıcının bu projedeki efektif rolü: proje sahibi → owner,
  // takım admin/owner → admin, diğer → member
  let myRole: 'owner' | 'admin' | 'member' = membership.role as 'owner' | 'member';
  if (myRole !== 'owner') {
    // Projeye bağlı takımlarda kullanıcının rolünü kontrol et
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId,
        team: { projects: { some: { projectId: id } } },
        role: { in: ['owner', 'admin'] },
      },
    });
    if (teamMember) myRole = teamMember.role as 'admin';
  }

  return NextResponse.json({ project, myRole });
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
