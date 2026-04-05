import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExportFormat = 'csv' | 'pdf' | 'json';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ExportJobDocument = ExportJob &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true, collection: 'exportjobs' })
export class ExportJob {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, enum: ['csv', 'pdf', 'json'] })
  format!: ExportFormat;

  @Prop({
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  status!: ExportStatus;

  @Prop({ required: false, index: true })
  downloadToken?: string;

  @Prop({ type: Buffer, required: false })
  fileData?: Buffer;

  @Prop({ required: false })
  mimeType?: string;

  @Prop({ type: Date, required: false, index: true })
  expiresAt?: Date;

  @Prop({
    type: Object,
    required: true,
  })
  options!: {
    from?: string;
    to?: string;
    includeCategories: boolean;
    includeReceipts: boolean;
    roomId?: string;
  };
}

export const ExportJobSchema = SchemaFactory.createForClass(ExportJob);
