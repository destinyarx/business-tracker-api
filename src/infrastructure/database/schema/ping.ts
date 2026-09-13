import { sql } from 'drizzle-orm';
import { integer, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const ping = pgTable('ping', {
	id: integer('id').primaryKey().notNull(),
	lastPingAt: timestamp('last_ping_at', {
		mode: 'date',
		withTimezone: true,
	})
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export type Ping = typeof ping.$inferSelect;
export type NewPing = typeof ping.$inferInsert;
