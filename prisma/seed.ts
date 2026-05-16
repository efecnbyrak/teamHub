import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('phyberk1905.', 12);

  await prisma.user.upsert({
    where: { email: 'phyberk@superadmin.com' },
    update: {},
    create: {
      firstName: 'Phyberk',
      lastName: 'Admin',
      email: 'phyberk@superadmin.com',
      passwordHash,
      role: 'super_admin',
      gorev: 'Süper Yönetici',
    },
  });

  console.log('Süper admin oluşturuldu: phyberk@superadmin.com');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
