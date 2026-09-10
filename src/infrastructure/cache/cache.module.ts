import { createKeyv } from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserCacheInterceptor } from './user-cache.interceptor';

function createRedisUrl(configService: ConfigService): string {
	const redisUrl = new URL(configService.getOrThrow<string>('REDIS_URL'));
	const redisToken = configService.get<string>('REDIS_TOKEN');

	if (redisToken) {
		redisUrl.password = redisToken;
	}

	// The previous Ioredis store always enabled TLS.
	redisUrl.protocol = 'rediss:';

	return redisUrl.toString();
}

@Global()
@Module({
	imports: [
		CacheModule.registerAsync({
			isGlobal: true,
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				ttl: 300_000,
				stores: [
					createKeyv(createRedisUrl(configService), {
						namespace: 'business-tracker',
					}),
				],
			}),
		}),
	],
	providers: [UserCacheInterceptor],
	exports: [CacheModule, UserCacheInterceptor],
})
export class InfrastructureCacheModule {}
