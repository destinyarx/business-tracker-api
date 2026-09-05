import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { InfrastructureCacheModule } from './infrastructure/cache/cache.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { SchedulingModule } from './infrastructure/scheduling/scheduling.module';
import { TransactionModule } from './features/transactions/transaction.module';
import { ExpensesModule } from './features/expenses/expenses.module';
import { CustomerModule } from './features/customers/customer.module';
import { AppointmentModule } from './features/appointments/appointment.module';
import { ServiceModule } from './features/services/service.module';
import { ProductModule } from './features/products/product.module';
import { EmailModule } from './features/email/email.module';
// import { ChatgptModule } from './features/chatgpt/chatgpt.module';
import { OrdersModule } from './features/orders/orders.module';
import { FilesModule } from './features/files/files.module';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true, cache: true }),
		AuthModule,
		InfrastructureCacheModule,
		DatabaseModule,
		SchedulingModule,
		ThrottlerModule.forRoot([
			{
				ttl: 30,
				limit: 2,
			},
		]),
		TransactionModule,
		ExpensesModule,
		CustomerModule,
		AppointmentModule,
		ServiceModule,
		EmailModule,
		// ChatgptModule,
		ProductModule,
		OrdersModule,
		FilesModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}
