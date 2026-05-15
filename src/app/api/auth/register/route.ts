import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signTokens } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json() as { name: string; email: string; password: string };

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Ad, e-posta ve şifre zorunludur' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Bu e-posta zaten kayıtlı' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, xp: true, level: true },
  });

  const tokens = signTokens(user.id);
  return NextResponse.json({ user, ...tokens }, { status: 201 });
}
