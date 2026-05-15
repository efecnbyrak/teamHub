import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { awardXp, xpForPriority } from '../services/xpService';
import { createNotification } from '../services/notificationService';

const router = Router();

router.use(authMiddleware);

router.get('/project/:projectId', async (req: AuthRequest, res: Response): Promise<void> => {
  const projectId = String(req.params['projectId']);
  const { status, assignedTo } = req.query as { status?: string; assignedTo?: string };

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: req.userId! } },
  });
  if (!member) {
    res.status(403).json({ error: 'Bu projeye erişim yetkiniz yok' });
    return;
  }

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      ...(status ? { status } : {}),
      ...(assignedTo ? { assignedTo } : {}),
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      creator: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ tasks });
});

router.post('/project/:projectId', async (req: AuthRequest, res: Response): Promise<void> => {
  const projectId = String(req.params['projectId']);
  const { title, description, priority, assignedTo, deadline } = req.body as {
    title: string;
    description?: string;
    priority?: string;
    assignedTo?: string;
    deadline?: string;
  };

  if (!title) {
    res.status(400).json({ error: 'Başlık zorunludur' });
    return;
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: req.userId! } },
  });
  if (!member) {
    res.status(403).json({ error: 'Bu projeye erişim yetkiniz yok' });
    return;
  }

  const resolvedPriority = priority || 'medium';
  const task = await prisma.task.create({
    data: {
      projectId,
      title,
      description,
      priority: resolvedPriority,
      xpReward: xpForPriority(resolvedPriority),
      assignedTo,
      createdBy: req.userId!,
      deadline: deadline ? new Date(deadline) : undefined,
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      creator: { select: { id: true, name: true } },
    },
  });

  if (assignedTo && assignedTo !== req.userId) {
    await createNotification(assignedTo, 'task_assigned', `Sana yeni bir görev atandı: "${title}"`);
  }

  res.status(201).json({ task });
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params['id']);
  const { title, description, priority, deadline, status } = req.body as {
    title?: string;
    description?: string;
    priority?: string;
    deadline?: string;
    status?: string;
  };

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    res.status(404).json({ error: 'Görev bulunamadı' });
    return;
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: task.projectId, userId: req.userId! } },
  });
  if (!member) {
    res.status(403).json({ error: 'Yetkiniz yok' });
    return;
  }

  const wasCompleted = task.status === 'done';
  const isNowCompleted = status === 'done';
  const completedAt = isNowCompleted && !wasCompleted ? new Date() : task.completedAt;

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(title ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(priority ? { priority, xpReward: xpForPriority(priority) } : {}),
      ...(deadline ? { deadline: new Date(deadline) } : {}),
      ...(status ? { status } : {}),
      completedAt,
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      creator: { select: { id: true, name: true } },
    },
  });

  if (isNowCompleted && !wasCompleted) {
    const targetUserId = task.assignedTo || req.userId!;
    const { newLevel, leveledUp } = await awardXp(
      targetUserId,
      updated.xpReward,
      'task_completed',
      id
    );

    if (leveledUp) {
      await createNotification(targetUserId, 'level_up', `Tebrikler! ${newLevel}. seviyeye ulaştın! 🎉`);
    }
  }

  res.json({ task: updated });
});

router.put('/:id/assign', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params['id']);
  const { assignedTo } = req.body as { assignedTo: string | null };

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    res.status(404).json({ error: 'Görev bulunamadı' });
    return;
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: task.projectId, userId: req.userId! } },
  });
  if (!member) {
    res.status(403).json({ error: 'Yetkiniz yok' });
    return;
  }

  const updated = await prisma.task.update({
    where: { id },
    data: { assignedTo },
    include: { assignee: { select: { id: true, name: true, avatar: true } } },
  });

  if (assignedTo && assignedTo !== req.userId) {
    await createNotification(assignedTo, 'task_assigned', `Sana bir görev atandı: "${task.title}"`);
  }

  res.json({ task: updated });
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params['id']);

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    res.status(404).json({ error: 'Görev bulunamadı' });
    return;
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: task.projectId, userId: req.userId! } },
  });
  if (!member) {
    res.status(403).json({ error: 'Yetkiniz yok' });
    return;
  }

  await prisma.task.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
