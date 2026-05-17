import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) } as any);

async function main() {
  // Super admin
  const phyberkHash = await bcrypt.hash('phyberk1905.', 12);
  await prisma.user.upsert({
    where: { email: 'phyberk@superadmin.com' },
    update: {},
    create: {
      firstName: 'Phyberk',
      lastName: 'Admin',
      email: 'phyberk@superadmin.com',
      passwordHash: phyberkHash,
      role: 'super_admin',
      gorev: 'Süper Yönetici',
    },
  });

  // efecanbayrak3557@gmail.com → super_admin
  const efeca = await prisma.user.findUnique({ where: { email: 'efecanbayrak3557@gmail.com' } });
  if (efeca) {
    await prisma.user.update({ where: { email: 'efecanbayrak3557@gmail.com' }, data: { role: 'super_admin' } });
    console.log('efecanbayrak3557@gmail.com → super_admin yapıldı');
  }

  const demoPass = await bcrypt.hash('demo1234.', 12);

  // Demo kullanıcılar
  const zeynep = await prisma.user.upsert({
    where: { email: 'zeynep.kaya@teamhub.com' },
    update: {},
    create: { firstName: 'Zeynep', lastName: 'Kaya', email: 'zeynep.kaya@teamhub.com', passwordHash: demoPass, gorev: 'Frontend Developer', xp: 340, level: 3 },
  });
  const mehmet = await prisma.user.upsert({
    where: { email: 'mehmet.arslan@teamhub.com' },
    update: {},
    create: { firstName: 'Mehmet', lastName: 'Arslan', email: 'mehmet.arslan@teamhub.com', passwordHash: demoPass, gorev: 'Backend Developer', xp: 580, level: 4 },
  });
  const ayse = await prisma.user.upsert({
    where: { email: 'ayse.demir@teamhub.com' },
    update: {},
    create: { firstName: 'Ayşe', lastName: 'Demir', email: 'ayse.demir@teamhub.com', passwordHash: demoPass, gorev: 'UI/UX Designer', xp: 210, level: 2 },
  });
  const can = await prisma.user.upsert({
    where: { email: 'can.yildiz@teamhub.com' },
    update: {},
    create: { firstName: 'Can', lastName: 'Yıldız', email: 'can.yildiz@teamhub.com', passwordHash: demoPass, gorev: 'DevOps Engineer', xp: 420, level: 3 },
  });
  const selin = await prisma.user.upsert({
    where: { email: 'selin.celik@teamhub.com' },
    update: {},
    create: { firstName: 'Selin', lastName: 'Çelik', email: 'selin.celik@teamhub.com', passwordHash: demoPass, gorev: 'Product Manager', xp: 750, level: 5 },
  });

  const ownerId = efeca?.id ?? zeynep.id;

  // ---- Proje 1: E-Ticaret Platformu ----
  const eticaret = await prisma.project.upsert({
    where: { inviteToken: 'eticaret-invite-token-001' },
    update: {},
    create: {
      name: 'E-Ticaret Platformu',
      description: 'Yeni nesil B2C e-ticaret altyapısı geliştirme projesi',
      ownerId,
      inviteToken: 'eticaret-invite-token-001',
    },
  });
  for (const userId of [zeynep.id, mehmet.id, ayse.id, can.id, selin.id]) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: eticaret.id, userId } },
      update: {},
      create: { projectId: eticaret.id, userId, role: userId === ownerId ? 'owner' : 'member' },
    });
  }
  const eticaretTasks = [
    { title: 'Ürün listeleme sayfası tasarımı', description: 'Filtreleme ve sıralama özellikleri ile ürün grid görünümü', status: 'done', priority: 'high', assignedTo: ayse.id, createdBy: ownerId, deadline: new Date('2026-05-01') },
    { title: 'Sepet ve ödeme akışı', description: 'Kredi kartı entegrasyonu ile ödeme sayfası', status: 'doing', priority: 'high', assignedTo: mehmet.id, createdBy: ownerId, deadline: new Date('2026-05-20') },
    { title: 'Kullanıcı kimlik doğrulama', description: 'JWT tabanlı kayıt, giriş ve şifre sıfırlama', status: 'done', priority: 'medium', assignedTo: mehmet.id, createdBy: ownerId, deadline: new Date('2026-04-28') },
    { title: 'Mobil responsive düzenleme', description: 'Tüm sayfaların mobil uyumlu hale getirilmesi', status: 'todo', priority: 'medium', assignedTo: zeynep.id, createdBy: ownerId, deadline: new Date('2026-05-25') },
    { title: 'CI/CD pipeline kurulumu', description: 'GitHub Actions ile otomatik test ve deploy', status: 'doing', priority: 'low', assignedTo: can.id, createdBy: ownerId, deadline: new Date('2026-05-18') },
    { title: 'Performans optimizasyonu', description: 'Lighthouse skoru 90+ hedefi', status: 'todo', priority: 'low', assignedTo: zeynep.id, createdBy: ownerId, deadline: new Date('2026-06-01') },
  ];
  for (const t of eticaretTasks) {
    await prisma.task.create({ data: { ...t, projectId: eticaret.id, xpReward: t.priority === 'high' ? 50 : t.priority === 'medium' ? 25 : 10 } });
  }

  // ---- Proje 2: Mobil Uygulama ----
  const mobil = await prisma.project.upsert({
    where: { inviteToken: 'mobil-invite-token-002' },
    update: {},
    create: {
      name: 'Mobil Uygulama',
      description: 'React Native ile iOS ve Android uygulaması',
      ownerId: selin.id,
      inviteToken: 'mobil-invite-token-002',
    },
  });
  for (const userId of [ownerId, zeynep.id, mehmet.id, can.id, selin.id]) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: mobil.id, userId } },
      update: {},
      create: { projectId: mobil.id, userId, role: userId === selin.id ? 'owner' : 'member' },
    });
  }
  const mobilTasks = [
    { title: 'Onboarding ekranları', description: 'Kullanıcı karşılama ve tanıtım slaytları', status: 'done', priority: 'medium', assignedTo: ayse.id, createdBy: selin.id, deadline: new Date('2026-04-20') },
    { title: 'Push notification entegrasyonu', description: 'Firebase Cloud Messaging ile bildirim sistemi', status: 'doing', priority: 'high', assignedTo: mehmet.id, createdBy: selin.id, deadline: new Date('2026-05-22') },
    { title: 'Çevrimdışı mod desteği', description: 'AsyncStorage ile veri önbellekleme', status: 'todo', priority: 'high', assignedTo: zeynep.id, createdBy: selin.id, deadline: new Date('2026-06-05') },
    { title: 'App Store yayınlama', description: 'iOS derleme ve App Store Connect yükleme', status: 'todo', priority: 'medium', assignedTo: can.id, createdBy: selin.id, deadline: new Date('2026-06-15') },
    { title: 'Analitik entegrasyonu', description: 'Mixpanel event tracking kurulumu', status: 'done', priority: 'low', assignedTo: selin.id, createdBy: selin.id, deadline: new Date('2026-04-30') },
  ];
  for (const t of mobilTasks) {
    await prisma.task.create({ data: { ...t, projectId: mobil.id, xpReward: t.priority === 'high' ? 50 : t.priority === 'medium' ? 25 : 10 } });
  }

  // ---- Proje 3: Dashboard Yenileme ----
  const dashboard = await prisma.project.upsert({
    where: { inviteToken: 'dashboard-invite-token-003' },
    update: {},
    create: {
      name: 'Dashboard Yenileme',
      description: 'Admin paneli ve raporlama arayüzünün modernizasyonu',
      ownerId: mehmet.id,
      inviteToken: 'dashboard-invite-token-003',
    },
  });
  for (const userId of [ownerId, zeynep.id, mehmet.id, ayse.id, selin.id]) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: dashboard.id, userId } },
      update: {},
      create: { projectId: dashboard.id, userId, role: userId === mehmet.id ? 'owner' : 'member' },
    });
  }
  const dashboardTasks = [
    { title: 'Figma tasarım sistemi', description: 'Component library ve design token oluşturma', status: 'done', priority: 'high', assignedTo: ayse.id, createdBy: mehmet.id, deadline: new Date('2026-04-25') },
    { title: 'Grafik bileşenleri', description: 'Recharts ile bar, line ve pie chart entegrasyonu', status: 'doing', priority: 'medium', assignedTo: zeynep.id, createdBy: mehmet.id, deadline: new Date('2026-05-19') },
    { title: 'Gerçek zamanlı veri akışı', description: 'WebSocket ile canlı dashboard güncellemeleri', status: 'todo', priority: 'high', assignedTo: mehmet.id, createdBy: mehmet.id, deadline: new Date('2026-05-28') },
    { title: 'Rapor export (PDF/Excel)', description: 'Kullanıcıların raporları indirmesi', status: 'todo', priority: 'low', assignedTo: zeynep.id, createdBy: mehmet.id, deadline: new Date('2026-06-10') },
  ];
  for (const t of dashboardTasks) {
    await prisma.task.create({ data: { ...t, projectId: dashboard.id, xpReward: t.priority === 'high' ? 50 : t.priority === 'medium' ? 25 : 10 } });
  }

  console.log('Seed tamamlandı. Demo kullanıcılar ve projeler oluşturuldu.');
  console.log('Demo giriş: zeynep.kaya@teamhub.com / demo1234.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
