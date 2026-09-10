import { Test, TestingModule } from '@nestjs/testing';
import { ChatgptService } from './chatgpt.service';
import { OpenAiService } from '../../integrations/openai/openai.service';

describe('ChatgptService', () => {
	let service: ChatgptService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ChatgptService,
				{
					provide: OpenAiService,
					useValue: { getChatResponse: jest.fn() },
				},
			],
		}).compile();

		service = module.get<ChatgptService>(ChatgptService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
