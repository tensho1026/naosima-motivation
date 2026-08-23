import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  driver: 'd1-http',
  schema: './src/db/schema/index.ts',
  out: './drizzle/migrations',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? 'set-for-studio',
    databaseId: process.env.CLOUDFLARE_DATABASE_ID ?? 'set-for-studio',
    token: process.env.CLOUDFLARE_D1_TOKEN ?? 'set-for-studio',
  },
  strict: true,
  verbose: true,
})
