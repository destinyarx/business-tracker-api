import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';
import { CreateEmailDto } from './dto/create-email.dto';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  async sendMail(@Body() createEmailDto: CreateEmailDto) {
    const { to, subject, text } = createEmailDto;

    const email = await this.emailService.sendMail(to, subject, text);
    return email;
  }
}
