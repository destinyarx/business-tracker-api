import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ClerkAuthGuard } from './auth/clerk-auth.guard';


import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './product/product.module';
import { TransactionModule } from './transaction/transaction.module';
import { ExpensesModule } from './expenses/expenses.module';
import { CustomerModule } from './customer/customer.module';

@Module({
  imports: [
    JwtModule.register({}),
    ProductModule, 
    TransactionModule, 
    ExpensesModule, 
    CustomerModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
  ],
})
export class AppModule {}
