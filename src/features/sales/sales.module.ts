import { Module } from '@nestjs/common';
import { SalesCacheService } from './sales-cache.service';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
	controllers: [SalesController],
	providers: [SalesService, SalesCacheService],
	exports: [SalesCacheService],
})
export class SalesModule {}
