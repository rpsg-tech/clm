
import { Module, Global } from '@nestjs/common';
import { EmailService } from './email/email.service';

@Global()
@Module({
    providers: [EmailService],
    exports: [EmailService],
})
export class CommonModule { }
