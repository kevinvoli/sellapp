import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async send(dto: {
    to: string;
    boutique: string;
    article: string;
    client: string;
    numero: string;
    adresse: string;
    commande: string;
    urlSuffix: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const token = this.config.get<string>('WA_TOKEN');
    const phoneNumberId = this.config.get<string>('WA_PHONE_NUMBER_ID');
    const apiVersion = this.config.get<string>('WA_API_VERSION', 'v20.0');
    const templateName = this.config.get<string>('WA_TEMPLATE_NAME');
    const templateLanguage = this.config.get<string>('WA_TEMPLATE_LANGUAGE', 'fr');

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: dto.to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLanguage },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', parameter_name: 'boutique', text: dto.boutique },
              { type: 'text', parameter_name: 'article',  text: dto.article },
              { type: 'text', parameter_name: 'client',   text: dto.client },
              { type: 'text', parameter_name: 'numero',   text: dto.numero },
              { type: 'text', parameter_name: 'adresse',  text: dto.adresse },
              { type: 'text', parameter_name: 'commande', text: dto.commande },
            ],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [
              { type: 'text', text: dto.urlSuffix },
            ],
          },
        ],
      },
    };

    try {
      const response = await firstValueFrom(
        this.http.post(url, payload, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      const messageId = response.data?.messages?.[0]?.id as string | undefined;
      return { success: true, messageId };
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      const error = axiosErr?.response?.data?.error?.message ?? axiosErr.message;
      return { success: false, error };
    }
  }

  verifyToken(token: string): boolean {
    const expected = this.config.get<string>('WA_WEBHOOK_VERIFY_TOKEN');
    return token === expected;
  }

  handleWebhook(body: unknown): void {
    const payload = body as Record<string, unknown>;

    if (payload?.object !== 'whatsapp_business_account') return;

    const entries = payload.entry as Array<Record<string, unknown>>;
    if (!Array.isArray(entries)) return;

    for (const entry of entries) {
      const changes = entry.changes as Array<Record<string, unknown>>;
      if (!Array.isArray(changes)) continue;

      for (const change of changes) {
        const value = change.value as Record<string, unknown>;
        if (!value) continue;

        // Messages entrants
        const messages = value.messages as Array<Record<string, unknown>>;
        if (Array.isArray(messages)) {
          for (const msg of messages) {
            this.logger.log(`Message reçu de ${msg.from as string} : ${JSON.stringify(msg)}`);
          }
        }

        // Statuts de livraison
        const statuses = value.statuses as Array<Record<string, unknown>>;
        if (Array.isArray(statuses)) {
          for (const status of statuses) {
            this.logger.log(`Statut message ${status.id as string} : ${status.status as string}`);
          }
        }
      }
    }
  }
}
