import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ReceiptAIService } from './receipt-ai.service';
import { ReceiptAIController } from './receipt-ai.controller';
import { OpenAIVisionProvider } from './providers/openai-vision.provider';
import { GoogleVisionProvider } from './providers/google-vision.provider';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
    TransactionModule,
  ],
  controllers: [ReceiptAIController],
  providers: [ReceiptAIService, OpenAIVisionProvider, GoogleVisionProvider],
})
export class ReceiptAIModule {}
