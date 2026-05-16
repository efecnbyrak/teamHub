import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const teams = await prisma.team.findMany({
    where: {
      OR: [
        { createdBy: userId },
        { members: { some: { userId } } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, description: true, createdAt: true,
      creator: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { members: true, projects: true } },
    },
  });

  return NextResponse.json({ teams });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { name, description } = await req.json() as { name: string; description?: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Takım adı zorunludur' }, { status: 400 });
  }

  const team = await prisma.team.create({
    data: {
      name: name.trim(),
      description,
      createdBy: userId,
      members: { create: { userId, role: 'owner' } },
    },
    select: {
      id: true, name: true, description: true, createdAt: true,
      creator: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { members: true, projects: true } },
    },
  });

  return NextResponse.json({ team }, { status: 201 });
}
