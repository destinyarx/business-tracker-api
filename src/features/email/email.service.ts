import { Injectable } from '@nestjs/common';
import { MailService } from '../../infrastructure/mail/mail.service';

@Injectable()
export class EmailService {
	constructor(private readonly mailService: MailService) {}

	async sendMail(to: string, subject: string, text: string) {
		return this.mailService.sendMail(to, subject, text);
	}
}
