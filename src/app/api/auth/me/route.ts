import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatar: true, xp: true, level: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

  return NextResponse.json({ user });
}
