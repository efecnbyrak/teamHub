import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

async function requireSuperAdmin(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'super_admin') return null;
  return userId;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSuperAdmin(req)) return unauthorized();

  const { id } = await params;
  const { role } = await req.json() as { role: string };

  if (!['user', 'super_admin'].includes(role)) {
    return NextResponse.json({ error: 'Geçersiz rol' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  });

  return NextResponse.json({ user });
}
