import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import appConfig from '../../../config/app.config';
import { IReceiptAIProvider } from '../interfaces/receipt-ai.interface';

@Injectable()
export class OpenAIVisionProvider implements IReceiptAIProvider {
  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {}

  async parseReceipt(imageBuffer: Buffer, language = 'ru') {
    const apiKey = this.config.openaiApiKey;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });
    const base64 = imageBuffer.toString('base64');
    
    const categories = language === 'ru' 
      ? 'Семья, Образование, Питомцы, Кино, Здоровье, Транспорт, Одежда, Еда, Игры, Книги, Спорт, Кафе, Покупки, Другое'
      : 'Family, Education, Pets, Cinema, Health, Transport, Clothing, Food, Games, Books, Sports, Cafe, Shopping, Other';
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract receipt data. Return JSON: amount (number), category (one of: ${categories}), description (string in ${language}), items (array, optional). Choose the most appropriate category from the list.`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64}` },
            },
          ],
        },
      ],
      max_tokens: 500,
    });
    const content = response.choices[0]?.message?.content ?? '{}';
    const match = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : '{}');
    
    const validCategories = language === 'ru'
      ? ['Семья', 'Образование', 'Питомцы', 'Кино', 'Здоровье', 'Транспорт', 'Одежда', 'Еда', 'Игры', 'Книги', 'Спорт', 'Кафе', 'Покупки', 'Другое']
      : ['Family', 'Education', 'Pets', 'Cinema', 'Health', 'Transport', 'Clothing', 'Food', 'Games', 'Books', 'Sports', 'Cafe', 'Shopping', 'Other'];
    
    const category = validCategories.includes(parsed.category) ? parsed.category : (language === 'ru' ? 'Другое' : 'Other');
    
    return {
      amount: parsed.amount ?? 0,
      category,
      description: parsed.description ?? '',
      items: parsed.items ?? [],
    };
  }
}
