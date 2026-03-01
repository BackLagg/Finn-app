export interface ReceiptData {
  amount: number;
  category: string;
  description: string;
  items?: { name: string; price?: number }[];
}

export const RECEIPT_AI_PROVIDER = 'RECEIPT_AI_PROVIDER';

export interface IReceiptAIProvider {
  parseReceipt(imageBuffer: Buffer, language?: string): Promise<ReceiptData>;
}
