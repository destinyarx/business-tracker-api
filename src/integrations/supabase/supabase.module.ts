import { Module } from '@nestjs/common';

import { SUPABASE_CLIENT } from './supabase.constants';
import { supabaseProvider } from './supabase.provider';

@Module({
	providers: [supabaseProvider],
	exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}
