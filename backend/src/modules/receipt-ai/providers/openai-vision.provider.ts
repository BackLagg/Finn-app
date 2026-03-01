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
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract receipt data. Return JSON: amount, category (food/transport/utilities/health/shopping/entertainment/other), description in ${language}, items array.`,
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
    return {
      amount: parsed.amount ?? 0,
      category: parsed.category ?? 'other',
      description: parsed.description ?? '',
      items: parsed.items ?? [],
    };
  }
}
