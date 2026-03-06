import {
  Controller,
  Post,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReceiptAIService } from './receipt-ai.service';
import { TransactionService } from '../transaction/transaction.service';
import { UserGuard } from '../../guards/user.guard';
import { SubscriptionGuard, RequireSubscription } from '../../guards/subscription.guard';
import { AuthenticatedRequest } from '../../interfaces/request.interface';
import { Types } from 'mongoose';
import { MultiCurrencyAmount } from '../../schemas/multi-currency-amount.schema';

function toMultiCurrencyAmount(value: number, currency: string): MultiCurrencyAmount {
  const curr = currency.toUpperCase();
  return {
    USD: curr === 'USD' ? value : 0,
    EUR: curr === 'EUR' ? value : 0,
    RUB: curr === 'RUB' ? value : 0,
    BYN: curr === 'BYN' ? value : 0,
  };
}

@Controller('receipt-ai')
@UseGuards(UserGuard)
export class ReceiptAIController {
  constructor(
    private readonly receiptAIService: ReceiptAIService,
    private readonly transactionService: TransactionService,
  ) {}

  private getUserId(req: AuthenticatedRequest): Types.ObjectId {
    const u = req.user as { _id?: Types.ObjectId };
    return u!._id!;
  }

  @Post('parse')
  @UseGuards(SubscriptionGuard)
  @RequireSubscription('finn_plus')
  @UseInterceptors(FileInterceptor('file'))
  async parse(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('No file uploaded');
    }
    const language = (req.query?.language as string) ?? 'ru';
    const parsed = await this.receiptAIService.parseReceipt(file.buffer, language);
    return parsed;
  }

  @Post('scan')
  @UseInterceptors(FileInterceptor('file'))
  async scan(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('No file uploaded');
    }
    const userId = this.getUserId(req);
    const language = (req.query?.language as string) ?? 'ru';
    const roomId = req.query?.roomId
      ? new Types.ObjectId(req.query.roomId as string)
      : undefined;

    const parsed = await this.receiptAIService.parseReceipt(file.buffer, language);
    const currency = language === 'ru' ? 'RUB' : 'USD';
    const transaction = await this.transactionService.create(userId, {
      amount: toMultiCurrencyAmount(parsed.amount, currency),
      inputCurrency: currency,
      type: 'expense',
      category: parsed.category,
      description: parsed.description,
      source: 'receipt_ai',
      roomId,
    });
    return { parsed, transaction };
  }
}
