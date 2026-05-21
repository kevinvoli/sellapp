import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { SendMessageDto } from './dto/send-message.dto';
import { WhatsappService } from './whatsapp.service';

@Controller()
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Post('whatsapp/send')
  send(@Body() dto: SendMessageDto) {
    return this.whatsappService.send(dto);
  }

  @Get('whatsapp/webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    if (mode === 'subscribe' && this.whatsappService.verifyToken(token)) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  @Post('whatsapp/webhook')
  @HttpCode(200)
  receiveWebhook(@Body() body: unknown) {
    this.whatsappService.handleWebhook(body);
    return 'OK';
  }
}
