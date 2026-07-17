import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import {
	FastifyAdapter,
	NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyMultipart from '@fastify/multipart';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptors';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe, BadRequestException } from '@nestjs/common';

async function bootstrap() {
	const fastifyAdapter = new FastifyAdapter();
	const rawFileParser = fastifyAdapter.getInstance();

	rawFileParser.addContentTypeParser(
		'application/octet-stream',
		(_request, payload, done) => done(null, payload),
	);
	rawFileParser.addContentTypeParser(
		/^image\//,
		(_request, payload, done) => done(null, payload),
	);

	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		fastifyAdapter,
	);

	await app.register(fastifyMultipart, {
		limits: {
			fieldNameSize: 100,
			fieldSize: 1_000_000,
			fields: Number.MAX_SAFE_INTEGER,
			fileSize: Number.MAX_SAFE_INTEGER,
			files: 1,
			headerPairs: 2_000,
			parts: Number.MAX_SAFE_INTEGER,
		},
	});

	app.enableCors({
		origin: [
			'http://localhost:3000', 
			'https://business-tracker-eta.vercel.app',
			'https://business-tracker.jeremy-dev.me',
		], 
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		credentials: true, // allow cookies/auth headers
	});

	app.useGlobalInterceptors(new ResponseInterceptor());
	app.useGlobalFilters(new HttpExceptionFilter());

	app.useGlobalPipes(
		new ValidationPipe({
		  transform: true,       
		  whitelist: true,
		  forbidNonWhitelisted: false,
		  exceptionFactory: (errors) => new BadRequestException(errors),
		}),
	)

	await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
bootstrap();
