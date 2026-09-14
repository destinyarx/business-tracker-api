import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_CLIENT } from '../../integrations/supabase/supabase.constants';

const STORAGE_BATCH_SIZE = 1_000;

type StorageObject = {
	id: string | null;
	name: string;
};

@Injectable()
export class AccountErasureStorageService {
	constructor(
		@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
		private readonly configService: ConfigService,
	) {}

	async erasePrefix(clerkUserId: string): Promise<number> {
		this.assertClerkUserId(clerkUserId);
		return this.eraseFolder(clerkUserId);
	}

	async isPrefixEmpty(clerkUserId: string): Promise<boolean> {
		this.assertClerkUserId(clerkUserId);
		return !(await this.folderHasObjects(clerkUserId));
	}

	private async eraseFolder(prefix: string): Promise<number> {
		let deleted = 0;

		while (true) {
			const objects = await this.listFirstPage(prefix);
			if (objects.length === 0) return deleted;

			const files = objects.filter((object) => Boolean(object.id));
			const folders = objects.filter((object) => !object.id);

			for (const folder of folders) {
				deleted += await this.eraseFolder(`${prefix}/${folder.name}`);
			}

			if (files.length > 0) {
				const paths = files.map((file) => `${prefix}/${file.name}`);
				const { error } = await this.bucket().remove(paths);
				if (error && !this.isMissingObjectError(error)) throw error;
				deleted += paths.length;
			}
		}
	}

	private async folderHasObjects(prefix: string): Promise<boolean> {
		let offset = 0;

		while (true) {
			const { data, error } = await this.bucket().list(prefix, {
				limit: STORAGE_BATCH_SIZE,
				offset,
				sortBy: { column: 'name', order: 'asc' },
			});
			if (error) throw error;

			const objects = data ?? [];
			for (const object of objects) {
				if (object.id) return true;
				if (await this.folderHasObjects(`${prefix}/${object.name}`)) {
					return true;
				}
			}

			if (objects.length < STORAGE_BATCH_SIZE) return false;
			offset += STORAGE_BATCH_SIZE;
		}
	}

	private async listFirstPage(prefix: string): Promise<StorageObject[]> {
		const { data, error } = await this.bucket().list(prefix, {
			limit: STORAGE_BATCH_SIZE,
			offset: 0,
			sortBy: { column: 'name', order: 'asc' },
		});
		if (error) throw error;
		return data ?? [];
	}

	private bucket() {
		return this.supabase.storage.from(
			this.configService.getOrThrow<string>('SUPABASE_STORAGE_BUCKET'),
		);
	}

	private assertClerkUserId(clerkUserId: string): void {
		if (!/^user_[A-Za-z0-9]+$/.test(clerkUserId)) {
			throw new Error('INVALID_CLERK_USER_ID');
		}
	}

	private isMissingObjectError(error: unknown): boolean {
		if (typeof error !== 'object' || error === null) return false;
		const value = error as {
			status?: number;
			statusCode?: number | string;
		};
		return value.status === 404 || String(value.statusCode) === '404';
	}
}
