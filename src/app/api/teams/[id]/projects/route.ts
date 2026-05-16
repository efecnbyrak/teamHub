import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

async function getMemberRole(teamId: string, userId: string): Promise<string | null> {
  const m = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { role: true },
  });
  return m?.role ?? null;
}

// Link a project to a team; auto-adds all team members as project members
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id: teamId } = await params;
  const callerRole = await getMemberRole(teamId, userId);

  if (callerRole !== 'owner' && callerRole !== 'admin') {
    return NextResponse.json({ error: 'Sadece owner veya admin proje bağlayabilir' }, { status: 403 });
  }

  const { projectId } = await req.json() as { projectId: string };
  if (!projectId) return NextResponse.json({ error: 'projectId zorunludur' }, { status: 400 });

  // Verify caller is a member of that project (owner or member)
  const projectMembership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!projectMembership) {
    return NextResponse.json({ error: 'Bu projeye erişim yetkiniz yok' }, { status: 403 });
  }

  const existing = await prisma.teamProject.findUnique({ where: { teamId_projectId: { teamId, projectId } } });
  if (existing) return NextResponse.json({ error: 'Proje zaten bu takıma bağlı' }, { status: 409 });

  await prisma.teamProject.create({ data: { teamId, projectId } });

  // Auto-add all team members to the project
  const teamMembers = await prisma.teamMember.findMany({ where: { teamId }, select: { userId: true } });
  for (const { userId: memberId } of teamMembers) {
    const alreadyMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: memberId } },
    });
    if (!alreadyMember) {
      await prisma.projectMember.create({ data: { projectId, userId: memberId, role: 'member' } });
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
