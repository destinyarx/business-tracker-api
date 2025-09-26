import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class SchedulerService {
  // Runs every 15 seconds
  @Interval(15000)
  handleInterval() {
    console.log('⏰ Task running at:', new Date().toISOString());
  }
}