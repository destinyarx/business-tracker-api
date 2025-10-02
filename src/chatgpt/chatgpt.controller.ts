import { Controller, Get, Query } from '@nestjs/common';
import { ChatgptService } from './chatgpt.service';

@Controller('chatgpt')
export class ChatgptController {
  constructor(private readonly chatgptService: ChatgptService) {}

  @Get('chat')
  async chat(@Query('q') query: string) {
    const result = await this.chatgptService.getChatResponse(query);
    return result;
  }
}
