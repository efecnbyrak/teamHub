import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { firstName, lastName, gorev, avatarColor } = await req.json() as {
    firstName?: string;
    lastName?: string;
    gorev?: string;
    avatarColor?: string;
  };

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(gorev !== undefined && { gorev }),
      ...(avatarColor !== undefined && { avatar: avatarColor }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      gorev: true,
      role: true,
      avatar: true,
      xp: true,
      level: true,
    },
  });

  return NextResponse.json({ user: updated });
}
