import prisma from '../lib/prisma';

export async function createNotification(
  userId: string,
  type: string,
  message: string
): Promise<void> {
  await prisma.notification.create({
    data: { userId, type, message },
  });
}
