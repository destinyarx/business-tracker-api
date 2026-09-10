import { Module } from '@nestjs/common';
import { ChatgptService } from './chatgpt.service';
import { ChatgptController } from './chatgpt.controller';
import { OpenAiModule } from '../../integrations/openai/openai.module';

@Module({
	imports: [OpenAiModule],
	controllers: [ChatgptController],
	providers: [ChatgptService],
})
export class ChatgptModule {}
