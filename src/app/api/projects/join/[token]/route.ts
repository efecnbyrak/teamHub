import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { token } = await params;

  const project = await prisma.project.findUnique({ where: { inviteToken: token } });
  if (!project) return NextResponse.json({ error: 'Geçersiz davet linki' }, { status: 404 });

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId } },
  });
  if (existing) return NextResponse.json({ error: 'Zaten bu projenin üyesisiniz' }, { status: 409 });

  await prisma.projectMember.create({
    data: { projectId: project.id, userId, role: 'member' },
  });

  await createNotification(project.ownerId, 'project_join', `Birileri '${project.name}' projesine katıldı.`);

  return NextResponse.json({ project: { id: project.id, name: project.name } });
}
