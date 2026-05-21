import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async send(
    to: string,
    message: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const token = this.config.get<string>('WA_TOKEN');
    const phoneNumberId = this.config.get<string>('WA_PHONE_NUMBER_ID');
    const apiVersion = this.config.get<string>('WA_API_VERSION', 'v20.0');
    const templateName = this.config.get<string>('WA_TEMPLATE_NAME');
    const templateLanguage = this.config.get<string>(
      'WA_TEMPLATE_LANGUAGE',
      'fr',
    );

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLanguage },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: message }],
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
      const error =
        axiosErr?.response?.data?.error?.message ?? axiosErr.message;
      return { success: false, error };
    }
  }
}
