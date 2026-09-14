import { sql } from 'drizzle-orm';
import {
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	timestamp,
	uniqueIndex,
	varchar,
} from 'drizzle-orm/pg-core';

export const accountErasureStatusEnum = pgEnum('account_erasure_status', [
	'pending',
	'processing',
	'retry',
	'completed',
	'failed',
]);

export const accountErasureRequests = pgTable(
	'account_erasure_requests',
	{
		id: serial('id').primaryKey().notNull(),
		webhookEventId: varchar('webhook_event_id', { length: 255 }).notNull(),
		clerkUserId: varchar('clerk_user_id', { length: 100 }),
		subjectHash: varchar('subject_hash', { length: 64 }).notNull(),
		status: accountErasureStatusEnum('status').default('pending').notNull(),
		attemptCount: integer('attempt_count').default(0).notNull(),
		nextAttemptAt: timestamp('next_attempt_at', {
			mode: 'date',
			withTimezone: true,
		})
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		receivedAt: timestamp('received_at', {
			mode: 'date',
			withTimezone: true,
		})
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		startedAt: timestamp('started_at', {
			mode: 'date',
			withTimezone: true,
		}),
		databaseDeletedAt: timestamp('database_deleted_at', {
			mode: 'date',
			withTimezone: true,
		}),
		storageDeletedAt: timestamp('storage_deleted_at', {
			mode: 'date',
			withTimezone: true,
		}),
		cacheDeletedAt: timestamp('cache_deleted_at', {
			mode: 'date',
			withTimezone: true,
		}),
		reconciledAt: timestamp('reconciled_at', {
			mode: 'date',
			withTimezone: true,
		}),
		completedAt: timestamp('completed_at', {
			mode: 'date',
			withTimezone: true,
		}),
		lastErrorCode: varchar('last_error_code', { length: 100 }),
	},
	(table) => ({
		webhookEventIdIdx: uniqueIndex(
			'account_erasure_requests_webhook_event_id_idx',
		).on(table.webhookEventId),
		subjectHashIdx: uniqueIndex(
			'account_erasure_requests_subject_hash_idx',
		).on(table.subjectHash),
		clerkUserIdIdx: index('account_erasure_requests_clerk_user_id_idx').on(
			table.clerkUserId,
		),
		eligibleIdx: index('account_erasure_requests_eligible_idx').on(
			table.status,
			table.nextAttemptAt,
		),
	}),
);

export type AccountErasureRequest = typeof accountErasureRequests.$inferSelect;
