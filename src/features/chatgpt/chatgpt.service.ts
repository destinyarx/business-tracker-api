import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../../integrations/openai/openai.service';

@Injectable()
export class ChatgptService {
	constructor(private readonly openAiService: OpenAiService) {}

	async getChatResponse(prompt: string): Promise<string> {
		return this.openAiService.getChatResponse(prompt);
	}
}
