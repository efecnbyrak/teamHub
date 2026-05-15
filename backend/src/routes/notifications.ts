import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ notifications });
});

router.put('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params['id']);
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== req.userId) {
    res.status(404).json({ error: 'Bildirim bulunamadı' });
    return;
  }
  await prisma.notification.update({ where: { id }, data: { read: true } });
  res.json({ success: true });
});

router.put('/read-all', async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.notification.updateMany({
    where: { userId: req.userId, read: false },
    data: { read: true },
  });
  res.json({ success: true });
});

export default router;
