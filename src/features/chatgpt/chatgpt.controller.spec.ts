import { Test, TestingModule } from '@nestjs/testing';
import { ChatgptController } from './chatgpt.controller';
import { ChatgptService } from './chatgpt.service';
import { OpenAiService } from '../../integrations/openai/openai.service';

describe('ChatgptController', () => {
	let controller: ChatgptController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ChatgptController],
			providers: [
				ChatgptService,
				{
					provide: OpenAiService,
					useValue: { getChatResponse: jest.fn() },
				},
			],
		}).compile();

		controller = module.get<ChatgptController>(ChatgptController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
