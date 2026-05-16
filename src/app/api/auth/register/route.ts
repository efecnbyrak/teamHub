import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signTokens } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { firstName, lastName, email, password, gorev } = await req.json() as {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    gorev: string;
  };

  if (!firstName || !lastName || !email || !password || !gorev) {
    return NextResponse.json({ error: 'Tüm alanlar zorunludur' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Geçerli bir e-posta adresi girin' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 });
  }

  if (!/[A-Z]/.test(password)) {
    return NextResponse.json({ error: 'Şifre en az bir büyük harf içermeli' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Bu e-posta zaten kayıtlı' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { firstName, lastName, email, passwordHash, gorev },
    select: { id: true, firstName: true, lastName: true, email: true, gorev: true, role: true, xp: true, level: true },
  });

  const tokens = signTokens(user.id);
  return NextResponse.json({ user, ...tokens }, { status: 201 });
}
