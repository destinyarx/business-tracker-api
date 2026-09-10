import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

import { SUPABASE_CLIENT } from './supabase.constants';

export const supabaseProvider = {
	provide: SUPABASE_CLIENT,
	inject: [ConfigService],
	useFactory: (configService: ConfigService) =>
		createClient(
			configService.getOrThrow<string>('SUPABASE_URL'),
			configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
			{
				auth: {
					autoRefreshToken: false,
					persistSession: false,
					detectSessionInUrl: false,
				},
			},
		),
};
