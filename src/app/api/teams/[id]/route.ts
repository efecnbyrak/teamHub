import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id: teamId } = await params;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true, name: true, description: true, createdAt: true,
      creator: { select: { id: true, firstName: true, lastName: true, email: true } },
      members: {
        select: {
          role: true, joinedAt: true,
          user: { select: { id: true, firstName: true, lastName: true, email: true, gorev: true, xp: true, level: true } },
        },
      },
      projects: {
        select: {
          project: { select: { id: true, name: true, description: true } },
        },
      },
    },
  });

  if (!team) return NextResponse.json({ error: 'Takım bulunamadı' }, { status: 404 });

  const isMember = team.members.some((m) => m.user.id === userId);
  if (!isMember) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });

  return NextResponse.json({ team });
}
