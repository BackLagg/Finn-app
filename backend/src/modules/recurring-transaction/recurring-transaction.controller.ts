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
import { RecurringTransactionService } from './recurring-transaction.service';
import {
  CreateRecurringTransactionDto,
  UpdateRecurringTransactionDto,
} from '../../dto/recurring-transaction.dto';
import { UserGuard } from '../../guards/user.guard';
import { AuthenticatedRequest } from '../../interfaces/request.interface';
import { Types } from 'mongoose';

@Controller('recurring-transaction')
@UseGuards(UserGuard)
export class RecurringTransactionController {
  constructor(private readonly recurringTransactionService: RecurringTransactionService) {}

  private getUserId(req: AuthenticatedRequest): Types.ObjectId {
    const u = req.user as { _id?: Types.ObjectId };
    return u!._id!;
  }

  @Get()
  async list(
    @Query('roomId') roomId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    return this.recurringTransactionService.findAll(
      userId,
      roomId ? new Types.ObjectId(roomId) : undefined,
    );
  }

  @Post()
  async create(@Body() dto: CreateRecurringTransactionDto, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.recurringTransactionService.create(userId, {
      amount: dto.amount,
      type: dto.type,
      category: dto.category,
      description: dto.description,
      frequency: dto.frequency,
      startDate: dto.startDate,
      roomId: dto.roomId ? new Types.ObjectId(dto.roomId) : undefined,
      currency: dto.currency,
    });
  }

  @Post(':id/trigger')
  async trigger(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.recurringTransactionService.triggerManual(id, userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRecurringTransactionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    return this.recurringTransactionService.update(id, userId, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    const deleted = await this.recurringTransactionService.delete(id, userId);
    return { deleted };
  }
}
