import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class ChatgptService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }
  
  
  // test github action
  // 1st
  // 2nd
  // 3rd
  async getChatResponse(prompt: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'openai/gpt-oss-20b:free',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
      });
  
      return response.choices[0].message.content ?? '';
    } catch (error: any) {
      console.error(error?.response?.data || error);
      throw error;
    }
  }
}
