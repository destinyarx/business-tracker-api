import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { JwtModule } from '@nestjs/jwt';
import { ClerkAuthGuard } from './auth/clerk-auth.guard';
// import { SchedulerService } from './scheduler/scheduler.service';

import { CacheModule } from '@nestjs/cache-manager';
import { createRedisStore } from './cache/redis.store';

import { TransactionModule } from './transaction/transaction.module';
import { ExpensesModule } from './expenses/expenses.module';
import { CustomerModule } from './customer/customer.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AppointmentModule } from './appointment/appointment.module';
import { ServiceModule } from './service/service.module';
import { ProductModule } from './product/product.module';
import { EmailModule } from './email/email.module';
import { ChatgptModule } from './chatgpt/chatgpt.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    JwtModule.register({}),
    CacheModule.register({
      isGlobal: true,
      ttl: 300_000, // 5 minutes
      store: createRedisStore(),
    }),
    ThrottlerModule.forRoot([{
      ttl: 30, 
      limit: 2,
    }]),
    TransactionModule, 
    ExpensesModule, 
    CustomerModule, 
    AppointmentModule, 
    ServiceModule, 
    EmailModule, 
    ChatgptModule, 
    ProductModule, 
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // SchedulerService, // uncomment this if u need schedule jobs
  ],
})
export class AppModule {}
