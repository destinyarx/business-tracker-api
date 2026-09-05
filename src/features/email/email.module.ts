import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { MailModule } from '../../infrastructure/mail/mail.module';

@Module({
	imports: [MailModule],
	controllers: [EmailController],
	providers: [EmailService],
})
export class EmailModule {}
