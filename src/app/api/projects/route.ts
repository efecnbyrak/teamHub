import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    include: {
      project: {
        include: {
          _count: { select: { tasks: true, members: true } },
          owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
      },
    },
  });

  return NextResponse.json({ projects: memberships.map((m) => ({ ...m.project, role: m.role })) });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { name, description } = await req.json() as { name: string; description?: string };
  if (!name) return NextResponse.json({ error: 'Proje adı zorunludur' }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      name,
      description,
      ownerId: userId,
      members: { create: { userId, role: 'owner' } },
    },
    include: { owner: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
  });

  return NextResponse.json({ project }, { status: 201 });
}
