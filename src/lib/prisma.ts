import 'server-only';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) } as any);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
