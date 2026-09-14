import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { ClerkModule } from '../integrations/clerk/clerk.module';
import { AccountErasureTombstoneService } from './account-erasure-tombstone.service';

@Module({
	imports: [ClerkModule],
	providers: [
		AccountErasureTombstoneService,
		ClerkAuthGuard,
		{
			provide: APP_GUARD,
			useExisting: ClerkAuthGuard,
		},
	],
	exports: [AccountErasureTombstoneService, ClerkAuthGuard],
})
export class AuthModule {}
