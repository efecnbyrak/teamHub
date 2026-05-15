import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

function signTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Ad, e-posta ve şifre zorunludur' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Bu e-posta zaten kayıtlı' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, xp: true, level: true },
  });

  const tokens = signTokens(user.id);
  res.status(201).json({ user, ...tokens });
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: 'E-posta ve şifre zorunludur' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Geçersiz kimlik bilgileri' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Geçersiz kimlik bilgileri' });
    return;
  }

  const tokens = signTokens(user.id);
  res.json({
    user: { id: user.id, name: user.name, email: user.email, xp: user.xp, level: user.level, avatar: user.avatar },
    ...tokens,
  });
});

router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken: string };
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token gerekli' });
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    const tokens = signTokens(payload.userId);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Geçersiz refresh token' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, avatar: true, xp: true, level: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    return;
  }
  res.json({ user });
});

export default router;
