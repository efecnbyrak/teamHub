import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) as any,
});

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'efecanbayrak3557@gmail.com' } });
  if (!user) {
    console.error('Kullanıcı bulunamadı: efecanbayrak3557@gmail.com — önce register olun.');
    process.exit(1);
  }

  const project = await prisma.project.create({
    data: {
      name: 'Deneme Projesi',
      description: 'Deneme amaçlı oluşturulmuş proje',
      ownerId: user.id,
      inviteToken: randomUUID(),
      members: {
        create: { userId: user.id, role: 'owner' },
      },
    },
  });
  console.log(`Proje oluşturuldu: ${project.name} (${project.id})`);

  const team = await prisma.team.create({
    data: {
      name: 'Deneme Takımı',
      description: 'Deneme amaçlı oluşturulmuş takım',
      createdBy: user.id,
      members: {
        create: { userId: user.id, role: 'owner' },
      },
    },
  });
  console.log(`Takım oluşturuldu: ${team.name} (${team.id})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
