import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import PDFDocument = require('pdfkit');
import { ExportJob, ExportJobDocument } from '../../schemas/export-job.schema';
import { TransactionService } from '../transaction/transaction.service';
import { PartnerRoomService } from '../partner-room/partner-room.service';
import { TransactionDocument } from '../../schemas/transaction.schema';
import { getAmountInCurrency } from '../../utils/amount-currency.util';
import { parseQueryDate, parseQueryDateEnd } from '../../utils/date.util';

const EXPORT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_EXPORTS_PER_HOUR = 5;

/**
 * Builds CSV/PDF/JSON exports and stores bytes on the job until expiry.
 */
@Injectable()
export class ExportService {
  constructor(
    @InjectModel(ExportJob.name)
    private exportJobModel: Model<ExportJobDocument>,
    private readonly transactionService: TransactionService,
    private readonly partnerRoomService: PartnerRoomService,
    private readonly configService: ConfigService,
  ) {}

  private async ensureRoom(userId: Types.ObjectId, roomId?: Types.ObjectId): Promise<void> {
    if (!roomId) return;
    const room = await this.partnerRoomService.findById(roomId.toString(), userId);
    if (!room) throw new HttpException('Room not found', HttpStatus.FORBIDDEN);
  }

  private async assertRateLimit(userId: Types.ObjectId): Promise<void> {
    const since = new Date(Date.now() - 3600000);
    const n = await this.exportJobModel.countDocuments({
      userId,
      createdAt: { $gte: since },
    });
    if (n >= MAX_EXPORTS_PER_HOUR) {
      throw new HttpException('Export rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private getDateRange(
    fromStr?: string,
    toStr?: string,
  ): { from?: Date; to?: Date } {
    if (!fromStr && !toStr) return {};
    return {
      from: fromStr ? parseQueryDate(fromStr.slice(0, 10)) : undefined,
      to: toStr ? parseQueryDateEnd(toStr.slice(0, 10)) : undefined,
    };
  }

  async generate(
    userId: Types.ObjectId,
    body: {
      format: 'csv' | 'pdf' | 'json';
      from?: string;
      to?: string;
      includeCategories?: boolean;
      includeReceipts?: boolean;
      roomId?: string;
    },
  ): Promise<{ downloadUrl: string; expiresAt: string }> {
    await this.assertRateLimit(userId);
    const roomId = body.roomId ? new Types.ObjectId(body.roomId) : undefined;
    await this.ensureRoom(userId, roomId);
    const { from, to } = this.getDateRange(body.from, body.to);
    const txs = await this.transactionService.findAll(userId, {
      roomId,
      from,
      to,
      limit: 100000,
    });
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + EXPORT_TTL_MS);
    const options = {
      from: body.from,
      to: body.to,
      includeCategories: body.includeCategories ?? false,
      includeReceipts: body.includeReceipts ?? false,
      roomId: body.roomId,
    };

    let fileData: Buffer;
    let mimeType: string;
    if (body.format === 'csv') {
      fileData = this.buildCsv(txs, body.includeReceipts ?? false);
      mimeType = 'text/csv';
    } else if (body.format === 'json') {
      fileData = Buffer.from(JSON.stringify(txs, null, 2), 'utf-8');
      mimeType = 'application/json';
    } else {
      fileData = await this.buildPdf(txs, options.includeCategories);
      mimeType = 'application/pdf';
    }

    const baseUrl =
      this.configService.get<string>('app.baseUrl') || 'http://localhost:8080';
    const downloadUrl = `${baseUrl.replace(/\/$/, '')}/api/export/download/${token}`;

    await this.exportJobModel.create({
      userId,
      format: body.format,
      status: 'completed',
      downloadToken: token,
      fileData,
      mimeType,
      expiresAt,
      options,
    });

    return { downloadUrl, expiresAt: expiresAt.toISOString() };
  }

  private buildCsv(txs: TransactionDocument[], includeReceipts: boolean): Buffer {
    const headers = includeReceipts
      ? ['Date', 'Type', 'Category', 'Amount', 'Currency', 'Description', 'Receipt']
      : ['Date', 'Type', 'Category', 'Amount', 'Currency', 'Description'];
    const lines = [headers.join(',')];
    for (const t of txs) {
      const cur = (t.inputCurrency || 'USD').toUpperCase();
      const amt = getAmountInCurrency(t.amount, cur);
      const row = [
        new Date(t.date).toISOString().slice(0, 10),
        t.type,
        this.csvEscape(t.category),
        String(amt),
        cur,
        this.csvEscape(t.description ?? ''),
      ];
      if (includeReceipts) row.push(this.csvEscape(t.receiptImageUrl ?? ''));
      lines.push(row.join(','));
    }
    return Buffer.from(lines.join('\n'), 'utf-8');
  }

  private csvEscape(s: string): string {
    const needs = /[",\n]/.test(s);
    const x = s.replace(/"/g, '""');
    return needs ? `"${x}"` : x;
  }

  private async buildPdf(
    txs: TransactionDocument[],
    includeCategories: boolean,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('error', reject);
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.fontSize(16).text('Finn export', { underline: true });
      doc.moveDown();
      doc.fontSize(10);
      if (includeCategories) {
        const map: Record<string, number> = {};
        for (const t of txs) {
          if (t.type !== 'expense') continue;
          const cur = (t.inputCurrency || 'USD').toUpperCase();
          const v = getAmountInCurrency(t.amount, cur);
          map[t.category] = (map[t.category] ?? 0) + v;
        }
        doc.text('Expense by category:');
        Object.entries(map)
          .sort((a, b) => b[1] - a[1])
          .forEach(([k, v]) => {
            doc.text(`  ${k}: ${v.toFixed(2)}`);
          });
        doc.moveDown();
      }
      doc.text('Transactions:');
      for (const t of txs.slice(0, 500)) {
        const cur = (t.inputCurrency || 'USD').toUpperCase();
        const amt = getAmountInCurrency(t.amount, cur);
        doc.text(
          `${new Date(t.date).toISOString().slice(0, 10)}  ${t.type}  ${t.category}  ${amt} ${cur}  ${t.description ?? ''}`,
        );
      }
      if (txs.length > 500) {
        doc.text(`... and ${txs.length - 500} more (truncated in PDF)`);
      }
      doc.end();
    });
  }

  async getFileByToken(token: string): Promise<{ data: Buffer; mimeType: string; filename: string }> {
    const job = await this.exportJobModel
      .findOne({ downloadToken: token })
      .exec();
    if (!job || !job.fileData || !job.expiresAt) {
      throw new NotFoundException('Export not found');
    }
    if (job.expiresAt.getTime() < Date.now()) {
      throw new NotFoundException('Export expired');
    }
    const ext = job.format === 'csv' ? 'csv' : job.format === 'json' ? 'json' : 'pdf';
    return {
      data: job.fileData,
      mimeType: job.mimeType || 'application/octet-stream',
      filename: `finn-export.${ext}`,
    };
  }

  async history(userId: Types.ObjectId): Promise<
    { _id: string; format: string; createdAt: string; downloadUrl: string }[]
  > {
    const baseUrl =
      this.configService.get<string>('app.baseUrl') || 'http://localhost:8080';
    const jobs = await this.exportJobModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();
    return jobs.map((j) => ({
      _id: j._id.toString(),
      format: j.format,
      createdAt: j.createdAt.toISOString(),
      downloadUrl: j.downloadToken
        ? `${baseUrl.replace(/\/$/, '')}/api/export/download/${j.downloadToken}`
        : '',
    }));
  }

  async deleteExpiredJobs(): Promise<number> {
    const res = await this.exportJobModel
      .deleteMany({ expiresAt: { $lt: new Date() } })
      .exec();
    return res.deletedCount ?? 0;
  }
}
