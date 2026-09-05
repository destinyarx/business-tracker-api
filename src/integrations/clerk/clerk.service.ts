import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';

export type ClerkTokenPayload = Awaited<ReturnType<typeof verifyToken>>;

@Injectable()
export class ClerkService {
	constructor(private readonly configService: ConfigService) {}

	verifyToken(token: string): Promise<ClerkTokenPayload> {
		return verifyToken(token, {
			secretKey:
				this.configService.getOrThrow<string>('CLERK_SECRET_KEY'),
			authorizedParties: this.getAuthorizedParties(),
		});
	}

	private getAuthorizedParties(): string[] {
		const configuredParties = this.configService.get<string>(
			'CLERK_AUTHORIZED_PARTIES',
		);

		if (configuredParties) {
			return configuredParties
				.split(',')
				.map((party) => party.trim())
				.filter(Boolean);
		}

		return [
			'http://localhost:3000',
			'https://business-tracker-eta.vercel.app',
			'https://business-tracker.jeremy-dev.me',
		];
	}
}
