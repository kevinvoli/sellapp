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

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('send')
  send(@Body() dto: SendMessageDto) {
    return this.whatsappService.send(dto.to, dto.message);
  }

  // Meta appelle ce endpoint pour vérifier le webhook
  @Get('webhook')
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

  // Meta envoie les événements (messages entrants, statuts) ici
  @Post('webhook')
  @HttpCode(200)
  receiveWebhook(@Body() body: unknown) {
    this.whatsappService.handleWebhook(body);
    return 'OK';
  }
}
