import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from '../../dto/transaction.dto';
import { UpdateTransactionDto } from '../../dto/transaction.dto';
import { UserGuard } from '../../guards/user.guard';
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

@Controller('transaction')
@UseGuards(UserGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  private getUserId(req: AuthenticatedRequest): Types.ObjectId {
    const u = req.user as { _id?: Types.ObjectId };
    return u!._id!;
  }

  @Post()
  async create(@Body() dto: CreateTransactionDto, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    const roomId = dto.roomId ? new Types.ObjectId(dto.roomId) : undefined;
    const currency = dto.currency ?? 'USD';
    return this.transactionService.create(userId, {
      amount: toMultiCurrencyAmount(dto.amount, currency),
      inputCurrency: currency,
      type: dto.type,
      category: dto.category,
      date: dto.date ? new Date(dto.date) : undefined,
      description: dto.description,
      roomId,
      receiptImageUrl: dto.receiptImageUrl,
    });
  }

  @Get()
  async findAll(
    @Query('roomId') roomId: string | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    return this.transactionService.findAll(userId, {
      roomId: roomId ? new Types.ObjectId(roomId) : undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('stats')
  async getStats(
    @Query('roomId') roomId: string | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    return this.transactionService.getStatsByCategory(userId, {
      roomId: roomId ? new Types.ObjectId(roomId) : undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('total-savings')
  async getTotalSavings(
    @Query('roomId') roomId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    const total = await this.transactionService.getTotalSavings(
      userId,
      roomId ? new Types.ObjectId(roomId) : undefined,
    );
    return { totalSavings: total };
  }

  @Get('stats/by-member')
  async getStatsByMember(
    @Query('roomId') roomId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    if (!roomId) return [];
    return this.transactionService.getStatsByMember(userId, {
      roomId: new Types.ObjectId(roomId),
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.transactionService.findById(id, userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    const data: Record<string, unknown> = {};
    const currency = dto.currency ?? 'USD';
    if (dto.amount !== undefined) data.amount = toMultiCurrencyAmount(dto.amount, currency);
    if (dto.amount !== undefined) data.inputCurrency = currency;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.receiptImageUrl !== undefined) data.receiptImageUrl = dto.receiptImageUrl;
    return this.transactionService.update(id, userId, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    await this.transactionService.delete(id, userId);
    return { ok: true };
  }
}
