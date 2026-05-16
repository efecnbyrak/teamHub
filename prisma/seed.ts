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

  // efecanbayrak3557@gmail.com kullanıcısını super_admin yap
  const efeca = await prisma.user.findUnique({ where: { email: 'efecanbayrak3557@gmail.com' } });
  if (efeca) {
    await prisma.user.update({
      where: { email: 'efecanbayrak3557@gmail.com' },
      data: { role: 'super_admin' },
    });
    console.log('efecanbayrak3557@gmail.com → super_admin yapıldı');
  } else {
    console.log('efecanbayrak3557@gmail.com bulunamadı, kayıt yoksa önce register olun');
  }

  console.log('Seed tamamlandı.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
