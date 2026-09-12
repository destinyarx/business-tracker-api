import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { SalesModule } from '../sales/sales.module';

@Module({
	imports: [SalesModule],
	controllers: [OrdersController],
	providers: [OrdersService],
})
export class OrdersModule {}
