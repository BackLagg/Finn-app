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
import { AuthenticatedRequest } from '../../interfaces/request.interface';
import { Types } from 'mongoose';

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
    const transaction = await this.transactionService.create(userId, {
      amount: parsed.amount,
      type: 'expense',
      category: parsed.category,
      description: parsed.description,
      source: 'receipt_ai',
      roomId,
    });
    return { parsed, transaction };
  }
}
