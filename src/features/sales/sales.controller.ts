import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { UserId } from '../../common/decorators/user-id.decorator';
import { GetSalesDto } from './dto/get-sales.dto';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
	constructor(private readonly salesService: SalesService) {}

	@Get()
	findAll(@UserId() userId: string, @Query() query: GetSalesDto) {
		return this.salesService.findAll(userId, query);
	}

	@Get(':id')
	findOne(@UserId() userId: string, @Param('id', ParseIntPipe) id: number) {
		return this.salesService.findOne(id, userId);
	}
}
