import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export * from './schema/users'
export * from './schema/customers'

config({ path: '.env' });

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle({ client });