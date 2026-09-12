import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { SalesModule } from '../sales/sales.module';

@Module({
	imports: [SalesModule],
	controllers: [ProductController],
	providers: [ProductService],
})
export class ProductModule {}
