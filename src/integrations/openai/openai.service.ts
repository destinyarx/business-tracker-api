import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
	private readonly client: OpenAI;
	private readonly model: string;

	constructor(configService: ConfigService) {
		const openAiApiKey = configService.get<string>('OPENAI_API_KEY');
		const openRouterApiKey =
			configService.get<string>('OPENROUTER_API_KEY');
		const apiKey = openAiApiKey ?? openRouterApiKey;

		if (!apiKey) {
			throw new Error('OPENAI_API_KEY or OPENROUTER_API_KEY is required');
		}

		this.client = new OpenAI({
			apiKey,
			baseURL:
				configService.get<string>('OPENAI_BASE_URL') ??
				(openAiApiKey ? undefined : 'https://openrouter.ai/api/v1'),
		});

		this.model =
			configService.get<string>('OPENAI_MODEL') ?? 'openrouter/free';
	}

	async getChatResponse(prompt: string): Promise<string> {
		const response = await this.client.chat.completions.create({
			model: this.model,
			messages: [
				{ role: 'system', content: 'You are a helpful assistant.' },
				{ role: 'user', content: prompt },
			],
		});

		return response.choices[0]?.message.content ?? '';
	}
}
