import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function getUserId(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.split(' ')[1]!;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

export function signTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
}
