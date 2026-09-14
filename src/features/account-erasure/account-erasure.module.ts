import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { InfrastructureCacheModule } from '../../infrastructure/cache/cache.module';
import { SupabaseModule } from '../../integrations/supabase/supabase.module';
import { AccountErasureConfigService } from './account-erasure-config.service';
import { AccountErasureController } from './account-erasure.controller';
import { AccountErasureService } from './account-erasure.service';
import { AccountErasureStorageService } from './account-erasure-storage.service';
import { AccountErasureWorker } from './account-erasure.worker';
import { ClerkWebhookVerifierService } from './clerk-webhook-verifier.service';

@Module({
	imports: [AuthModule, InfrastructureCacheModule, SupabaseModule],
	controllers: [AccountErasureController],
	providers: [
		AccountErasureConfigService,
		AccountErasureService,
		AccountErasureStorageService,
		AccountErasureWorker,
		ClerkWebhookVerifierService,
	],
})
export class AccountErasureModule {}
