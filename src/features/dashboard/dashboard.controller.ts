import { Controller, Get, Query } from '@nestjs/common';
import { UserId } from '../../common/decorators/user-id.decorator';
import { DashboardService } from './dashboard.service';
import { GetDashboardDto } from './dto/get-dashboard.dto';

@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	@Get()
	getOverview(
		@UserId() userId: string,
		@Query() query: GetDashboardDto,
	) {
		return this.dashboardService.getOverview(userId, query);
	}
}
