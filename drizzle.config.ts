import type { Config } from 'drizzle-kit';

/**
 * Config do Drizzle Kit. O schema-fonte da verdade do DDL é db/neon/0001_init.sql
 * (aplicado por `npm run db:apply`). Este arquivo habilita introspecção e futuras
 * migrações incrementais via `npx drizzle-kit` sobre o mesmo banco Neon.
 */
export default {
    schema: './src/db/schema.ts',
    out: './db/neon/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL ?? '',
    },
} satisfies Config;
