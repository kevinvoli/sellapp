import { Body, Controller, Post } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto';
import { WhatsappService } from './whatsapp.service';


@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('send')
  send(@Body() dto: SendMessageDto) {
    return this.whatsappService.send(dto.to, dto.message);
  }
}
