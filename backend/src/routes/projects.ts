import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { createNotification } from '../services/notificationService';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const memberships = await prisma.projectMember.findMany({
    where: { userId: req.userId },
    include: {
      project: {
        include: {
          _count: { select: { tasks: true, members: true } },
          owner: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });
  res.json({ projects: memberships.map((m) => ({ ...m.project, role: m.role })) });
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description } = req.body as { name: string; description?: string };
  if (!name) {
    res.status(400).json({ error: 'Proje adı zorunludur' });
    return;
  }

  const project = await prisma.project.create({
    data: {
      name,
      description,
      ownerId: req.userId!,
      members: {
        create: { userId: req.userId!, role: 'owner' },
      },
    },
    include: { owner: { select: { id: true, name: true, avatar: true } } },
  });

  res.status(201).json({ project });
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params['id']);

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId: req.userId! } },
  });
  if (!membership) {
    res.status(403).json({ error: 'Bu projeye erişim yetkiniz yok' });
    return;
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, avatar: true } },
      members: {
        include: { user: { select: { id: true, name: true, avatar: true, xp: true, level: true } } },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  res.json({ project });
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params['id']);
  const { name, description } = req.body as { name?: string; description?: string };

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.ownerId !== req.userId) {
    res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    return;
  }

  const updated = await prisma.project.update({ where: { id }, data: { name, description } });
  res.json({ project: updated });
});

router.get('/:id/invite', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params['id']);

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.ownerId !== req.userId) {
    res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    return;
  }

  const inviteLink = `${process.env.CLIENT_URL}/invite/${project.inviteToken}`;
  res.json({ inviteLink, inviteToken: project.inviteToken });
});

router.post('/join/:token', async (req: AuthRequest, res: Response): Promise<void> => {
  const token = String(req.params['token']);

  const project = await prisma.project.findUnique({ where: { inviteToken: token } });
  if (!project) {
    res.status(404).json({ error: 'Geçersiz davet linki' });
    return;
  }

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId: req.userId! } },
  });
  if (existing) {
    res.status(409).json({ error: 'Zaten bu projenin üyesisiniz' });
    return;
  }

  await prisma.projectMember.create({
    data: { projectId: project.id, userId: req.userId!, role: 'member' },
  });

  await createNotification(
    project.ownerId,
    'project_join',
    `Birileri '${project.name}' projesine katıldı.`
  );

  res.json({ project: { id: project.id, name: project.name } });
});

export default router;
