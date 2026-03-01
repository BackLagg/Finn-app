import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import appConfig from '../../../config/app.config';
import { IReceiptAIProvider } from '../interfaces/receipt-ai.interface';

@Injectable()
export class GoogleVisionProvider implements IReceiptAIProvider {
  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {}

  async parseReceipt(imageBuffer: Buffer, _language = 'ru') {
    const credentialsPath = this.config.googleApplicationCredentials;
    if (!credentialsPath) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS is not configured');
    }
    const vision = await import('@google-cloud/vision');
    const client = new vision.ImageAnnotatorClient({
      keyFilename: credentialsPath,
    });
    const [result] = await client.textDetection({
      image: { content: imageBuffer },
    });
    const fullText = result.fullTextAnnotation?.text ?? '';
    const amount = this.extractAmount(fullText);
    return {
      amount,
      category: 'other',
      description: fullText.slice(0, 200),
      items: [],
    };
  }

  private extractAmount(text: string): number {
    const match =
      text.match(/(?:итого|total|сумма|sum)[:\s]*(\d+[.,]?\d*)/i) ??
      text.match(/(\d+[.,]\d{2})\s*(?:руб|р\.|₽|eur|usd)/i) ??
      text.match(/(\d+[.,]\d{2})/);
    if (!match) return 0;
    return parseFloat(match[1].replace(',', '.'));
  }
}
