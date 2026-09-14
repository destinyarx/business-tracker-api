import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../integrations/supabase/supabase.constants';

@Injectable()
export class FilesService {
	constructor(
		@Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
		private readonly configService: ConfigService,
	) {}

	async uploadProductImage(
		userId: string,
		buffer: Buffer,
		filename: string,
		mimetype: string,
	) {
		const bucket = this.storageBucket;
		const name = `${userId}-${Date.now()}-${crypto.randomUUID()}-${filename}`;
		const path = `${userId}/${name}`;

		const { data, error } = await this.supabase.storage
			.from(bucket)
			.upload(path, buffer, {
				contentType: mimetype,
				upsert: false,
			});

		if (error) {
			throw error;
		}

		const { data: publicData } = this.supabase.storage
			.from(bucket)
			.getPublicUrl(data.path);

		return {
			imageName: name,
			path: data.path,
			publicUrl: publicData.publicUrl,
		};
	}

	async deleteProductImage(userId: string, filename: string) {
		const { error } = await this.supabase.storage
			.from(this.storageBucket)
			.remove([`${userId}/${filename}`]);

		if (error) {
			throw error;
		}

		return true;
	}

	private get storageBucket(): string {
		return this.configService.getOrThrow<string>('SUPABASE_STORAGE_BUCKET');
	}
}
