import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { signTokens } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { refreshToken } = await req.json() as { refreshToken: string };
  if (!refreshToken) {
    return NextResponse.json({ error: 'Refresh token gerekli' }, { status: 400 });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    return NextResponse.json(signTokens(payload.userId));
  } catch {
    return NextResponse.json({ error: 'Geçersiz refresh token' }, { status: 401 });
  }
}
