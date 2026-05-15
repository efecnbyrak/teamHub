import { defineConfig } from 'prisma/config';
import { PrismaNeon } from '@prisma/adapter-neon';
import 'dotenv/config';

export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  datasource: {
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  },
});
