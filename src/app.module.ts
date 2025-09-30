import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ClerkAuthGuard } from './auth/clerk-auth.guard';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './product/product.module';
import { TransactionModule } from './transaction/transaction.module';
import { ExpensesModule } from './expenses/expenses.module';
import { CustomerModule } from './customer/customer.module';
import { ScheduleModule } from '@nestjs/schedule';
// import { SchedulerService } from './scheduler/scheduler.service';
import { AppointmentModule } from './appointment/appointment.module';
import { ServiceModule } from './service/service.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 30, 
      limit: 2,
    }]),
    JwtModule.register({}),
    ProductModule, 
    TransactionModule, 
    ExpensesModule, 
    CustomerModule, AppointmentModule, ServiceModule, EmailModule, 
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // {
    //   provide: APP_GUARD,
    //   useClass: ClerkAuthGuard,
    // },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // SchedulerService // uncomment this if u need schedule jobs
  ],
})
export class AppModule {}
