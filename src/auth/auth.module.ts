import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { ClerkModule } from '../integrations/clerk/clerk.module';

@Module({
	imports: [ClerkModule],
	providers: [
		ClerkAuthGuard,
		{
			provide: APP_GUARD,
			useExisting: ClerkAuthGuard,
		},
	],
	exports: [ClerkAuthGuard],
})
export class AuthModule {}
