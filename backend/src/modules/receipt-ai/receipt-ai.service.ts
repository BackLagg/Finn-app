import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import appConfig from '../../config/app.config';
import { IReceiptAIProvider } from './interfaces/receipt-ai.interface';
import { OpenAIVisionProvider } from './providers/openai-vision.provider';
import { GoogleVisionProvider } from './providers/google-vision.provider';

@Injectable()
export class ReceiptAIService {
  private provider: IReceiptAIProvider;

  constructor(
    @Inject(appConfig.KEY)
    config: ConfigType<typeof appConfig>,
    openaiProvider: OpenAIVisionProvider,
    googleProvider: GoogleVisionProvider,
  ) {
    const p = config.aiReceiptProvider;
    this.provider = p === 'google' ? googleProvider : openaiProvider;
  }

  async parseReceipt(imageBuffer: Buffer, language?: string) {
    return this.provider.parseReceipt(imageBuffer, language ?? 'ru');
  }
}
