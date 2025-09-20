import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
	getHello(): string {
		return 'My First NestJS App! <br/> This is crazy';
	}

	getString(): string {
		return 'This is the string';
	}
}
