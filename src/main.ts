import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptors';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: ['http://localhost:3001', 'https://yourfrontend.com'], // allowed origins
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		credentials: true, // allow cookies/auth headers
	});

	app.useGlobalInterceptors(new ResponseInterceptor());
	app.useGlobalFilters(new HttpExceptionFilter());

	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
