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

export async function GET(req: NextRequest) {
  if (!await requireSuperAdmin(req)) return unauthorized();

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, description: true, createdAt: true,
      owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      _count: { select: { members: true, tasks: true } },
    },
  });

  return NextResponse.json({ projects });
}
