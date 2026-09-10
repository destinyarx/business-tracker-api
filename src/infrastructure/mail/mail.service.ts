import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
	private transporter: Transporter;

	constructor() {
		this.transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: process.env.GMAIL_USER, // your Gmail
				pass: process.env.GMAIL_PASS, // app password
			},
		});
	}

	async sendMail(to: string, subject: string, text: string) {
		const info: unknown = await this.transporter.sendMail({
			from: `"My App" <${process.env.GMAIL_USER}>`,
			to,
			subject,
			text,
		});
		const messageId =
			typeof info === 'object' && info !== null && 'messageId' in info
				? info.messageId
				: undefined;

		console.log('Email sent: ', messageId);
	}
}
