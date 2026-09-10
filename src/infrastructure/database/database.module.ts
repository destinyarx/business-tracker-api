import { Global, Module } from '@nestjs/common';

import { DATABASE } from './database.constants';
import { db } from './index';

@Global()
@Module({
	providers: [
		{
			provide: DATABASE,
			useValue: db,
		},
	],
	exports: [DATABASE],
})
export class DatabaseModule {}
