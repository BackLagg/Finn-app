import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetSettingsDto } from '../../dto/budget.dto';
import { UserGuard } from '../../guards/user.guard';
import { AuthenticatedRequest } from '../../interfaces/request.interface';
import { Types } from 'mongoose';

@Controller('budget')
@UseGuards(UserGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  private getUserId(req: AuthenticatedRequest): Types.ObjectId {
    const u = req.user as { _id?: Types.ObjectId };
    return u!._id!;
  }

  @Get()
  async get(
    @Query('roomId') roomId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    return this.budgetService.findForUser(
      userId,
      roomId ? new Types.ObjectId(roomId) : undefined,
    );
  }

  @Post()
  async upsert(@Body() dto: CreateBudgetSettingsDto, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.budgetService.upsert(userId, {
      currency: dto.currency,
      monthlyIncome: dto.monthlyIncome,
      fixedExpenses: dto.fixedExpenses,
      savingsPercent: dto.savingsPercent,
      investmentsPercent: dto.investmentsPercent,
      purchasesPercent: dto.purchasesPercent,
      roomId: dto.roomId ? new Types.ObjectId(dto.roomId) : undefined,
    });
  }
}
