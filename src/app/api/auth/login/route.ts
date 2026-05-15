import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signTokens } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json() as { email: string; password: string };

  if (!email || !password) {
    return NextResponse.json({ error: 'E-posta ve şifre zorunludur' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: 'Geçersiz kimlik bilgileri' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Geçersiz kimlik bilgileri' }, { status: 401 });
  }

  const tokens = signTokens(user.id);
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, xp: user.xp, level: user.level, avatar: user.avatar },
    ...tokens,
  });
}
