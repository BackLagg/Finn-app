import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportJob, ExportJobSchema } from '../../schemas/export-job.schema';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { TransactionModule } from '../transaction/transaction.module';
import { PartnerRoomModule } from '../partner-room/partner-room.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ExportJob.name, schema: ExportJobSchema }]),
    TransactionModule,
    PartnerRoomModule,
  ],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
