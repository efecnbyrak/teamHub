import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId, unauthorized } from '@/lib/auth';

async function getMemberRole(teamId: string, userId: string): Promise<string | null> {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { role: true },
  });
  return member?.role ?? null;
}


export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id: teamId } = await params;
  const callerRole = await getMemberRole(teamId, userId);

  if (!callerRole) {
    return NextResponse.json({ error: 'Bu takımın üyesi değilsiniz' }, { status: 403 });
  }

  const { email } = await req.json() as { email: string };
  if (!email) return NextResponse.json({ error: 'E-posta zorunludur' }, { status: 400 });

  const targetUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!targetUser) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: targetUser.id } },
  });
  if (existing) return NextResponse.json({ error: 'Kullanıcı zaten takımda' }, { status: 409 });

  await prisma.teamMember.create({ data: { teamId, userId: targetUser.id, role: 'member' } });

  // Auto-add to all linked projects as project member
  const linkedProjects = await prisma.teamProject.findMany({ where: { teamId }, select: { projectId: true } });
  for (const { projectId } of linkedProjects) {
    const alreadyMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUser.id } },
    });
    if (!alreadyMember) {
      await prisma.projectMember.create({ data: { projectId, userId: targetUser.id, role: 'member' } });
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id: teamId } = await params;
  const callerRole = await getMemberRole(teamId, userId);

  if (callerRole !== 'owner' && callerRole !== 'admin') {
    return NextResponse.json({ error: 'Yetersiz yetki' }, { status: 403 });
  }

  const { userId: targetUserId, role } = await req.json() as { userId: string; role: string };
  if (!targetUserId || !role) return NextResponse.json({ error: 'userId ve role zorunludur' }, { status: 400 });
  if (!['owner', 'admin', 'member'].includes(role)) {
    return NextResponse.json({ error: 'Geçersiz rol' }, { status: 400 });
  }

  // Only owner can assign owner or admin role
  if (role === 'owner' && callerRole !== 'owner') {
    return NextResponse.json({ error: 'Sadece owner rol atayabilir' }, { status: 403 });
  }

  // Admin cannot change owner's role
  const targetRole = await getMemberRole(teamId, targetUserId);
  if (targetRole === 'owner' && callerRole !== 'owner') {
    return NextResponse.json({ error: 'Owner rolü değiştirilemez' }, { status: 403 });
  }

  await prisma.teamMember.update({
    where: { teamId_userId: { teamId, userId: targetUserId } },
    data: { role },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id: teamId } = await params;
  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId');
  if (!targetUserId) return NextResponse.json({ error: 'userId parametresi gerekli' }, { status: 400 });

  const callerRole = await getMemberRole(teamId, userId);
  if (callerRole !== 'owner' && callerRole !== 'admin' && userId !== targetUserId) {
    return NextResponse.json({ error: 'Yetersiz yetki' }, { status: 403 });
  }

  // Cannot remove owner unless you are owner
  const targetRole = await getMemberRole(teamId, targetUserId);
  if (targetRole === 'owner' && userId !== targetUserId) {
    return NextResponse.json({ error: 'Owner takımdan çıkarılamaz' }, { status: 403 });
  }

  await prisma.teamMember.deleteMany({ where: { teamId, userId: targetUserId } });

  return NextResponse.json({ ok: true });
}
