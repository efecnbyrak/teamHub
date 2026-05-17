import { defineConfig } from 'prisma/config';
import { PrismaNeon } from '@prisma/adapter-neon';
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

const dbUrl = process.env.DATABASE_URL!;

export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  migrations: {
    seed: 'npx ts-node --compiler-options {"module":"CommonJS"} ./prisma/seed.ts',
  },
  datasource: {
    adapter: new PrismaNeon({ connectionString: dbUrl }),
    url: dbUrl,
  },
});
