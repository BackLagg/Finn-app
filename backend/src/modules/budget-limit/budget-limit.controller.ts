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
import { BudgetLimitService } from './budget-limit.service';
import { CreateBudgetLimitDto, UpdateBudgetLimitDto } from '../../dto/budget-limit.dto';
import { UserGuard } from '../../guards/user.guard';
import { AuthenticatedRequest } from '../../interfaces/request.interface';
import { Types } from 'mongoose';

@Controller('budget-limit')
@UseGuards(UserGuard)
export class BudgetLimitController {
  constructor(private readonly budgetLimitService: BudgetLimitService) {}

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
    return this.budgetLimitService.findAll(
      userId,
      roomId ? new Types.ObjectId(roomId) : undefined,
    );
  }

  @Get('status')
  async status(
    @Query('roomId') roomId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    return this.budgetLimitService.getStatus(
      userId,
      roomId ? new Types.ObjectId(roomId) : undefined,
    );
  }

  @Post()
  async create(@Body() dto: CreateBudgetLimitDto, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.budgetLimitService.create(userId, {
      category: dto.category,
      limit: dto.limit,
      currency: dto.currency,
      period: dto.period,
      roomId: dto.roomId ? new Types.ObjectId(dto.roomId) : undefined,
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetLimitDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    return this.budgetLimitService.update(id, userId, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    const deleted = await this.budgetLimitService.delete(id, userId);
    return { deleted };
  }
}
