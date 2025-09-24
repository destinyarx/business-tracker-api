import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: ['http://localhost:3001', 'https://yourfrontend.com'], // allowed origins
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		credentials: true, // allow cookies/auth headers
	});


	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
