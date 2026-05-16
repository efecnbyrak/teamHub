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

// Unlink a project from a team
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; projectId: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id: teamId, projectId } = await params;
  const callerRole = await getMemberRole(teamId, userId);

  if (callerRole !== 'owner' && callerRole !== 'admin') {
    return NextResponse.json({ error: 'Sadece owner veya admin proje bağlantısını kesebilir' }, { status: 403 });
  }

  await prisma.teamProject.deleteMany({ where: { teamId, projectId } });

  return NextResponse.json({ ok: true });
}
