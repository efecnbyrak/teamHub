import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

async function requireOwner(teamId: string, userId: string) {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { role: true },
  });
  return member?.role === 'owner';
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id: teamId } = await params;

  if (!await requireOwner(teamId, userId)) {
    return NextResponse.json({ error: 'Sadece takım sahibi üye ekleyebilir' }, { status: 403 });
  }

  const { email } = await req.json() as { email: string };
  if (!email) return NextResponse.json({ error: 'E-posta zorunludur' }, { status: 400 });

  const targetUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!targetUser) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: targetUser.id } },
  });
  if (existing) return NextResponse.json({ error: 'Kullanıcı zaten takımda' }, { status: 409 });

  await prisma.teamMember.create({ data: { teamId, userId: targetUser.id } });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id: teamId } = await params;
  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId');
  if (!targetUserId) return NextResponse.json({ error: 'userId parametresi gerekli' }, { status: 400 });

  const isOwner = await requireOwner(teamId, userId);
  if (!isOwner && userId !== targetUserId) {
    return NextResponse.json({ error: 'Yetersiz yetki' }, { status: 403 });
  }

  await prisma.teamMember.deleteMany({ where: { teamId, userId: targetUserId } });

  return NextResponse.json({ ok: true });
}
