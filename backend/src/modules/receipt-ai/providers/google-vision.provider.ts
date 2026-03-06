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

  async parseReceipt(imageBuffer: Buffer, language = 'ru') {
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
    const category = this.guessCategory(fullText, language);
    return {
      amount,
      category,
      description: fullText.slice(0, 200),
      items: [],
    };
  }

  private guessCategory(text: string, language: string): string {
    const lowerText = text.toLowerCase();
    
    if (language === 'ru') {
      if (lowerText.match(/кафе|ресторан|столовая|бар|пицца|суши/)) return 'Кафе';
      if (lowerText.match(/продукты|магазин|супермаркет|гастроном/)) return 'Еда';
      if (lowerText.match(/транспорт|такси|билет|метро|автобус/)) return 'Транспорт';
      if (lowerText.match(/аптека|лекарств|клиника|врач/)) return 'Здоровье';
      if (lowerText.match(/одежда|обувь|магазин одежды/)) return 'Одежда';
      if (lowerText.match(/кино|театр|билет/)) return 'Кино';
      if (lowerText.match(/книг|библиотека/)) return 'Книги';
      if (lowerText.match(/спорт|фитнес|зал/)) return 'Спорт';
      return 'Другое';
    } else {
      if (lowerText.match(/cafe|restaurant|bar|pizza|sushi/)) return 'Cafe';
      if (lowerText.match(/grocery|supermarket|store/)) return 'Food';
      if (lowerText.match(/transport|taxi|ticket|metro|bus/)) return 'Transport';
      if (lowerText.match(/pharmacy|medicine|clinic|doctor/)) return 'Health';
      if (lowerText.match(/clothing|shoes|apparel/)) return 'Clothing';
      if (lowerText.match(/cinema|theater|ticket/)) return 'Cinema';
      if (lowerText.match(/book|library/)) return 'Books';
      if (lowerText.match(/sport|fitness|gym/)) return 'Sports';
      return 'Other';
    }
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
