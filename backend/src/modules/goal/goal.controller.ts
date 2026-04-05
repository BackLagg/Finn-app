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
import { GoalService } from './goal.service';
import { CreateGoalDto } from '../../dto/goal.dto';
import { UpdateGoalDto } from '../../dto/goal.dto';
import { UserGuard } from '../../guards/user.guard';
import { AuthenticatedRequest } from '../../interfaces/request.interface';
import { Types } from 'mongoose';
import { parseLocalDate } from '../../utils/date.util';
import { GoalDocument } from '../../schemas/goal.schema';
import { getAmountInCurrency } from '../../utils/amount-currency.util';

@Controller('goal')
@UseGuards(UserGuard)
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  private getUserId(req: AuthenticatedRequest): Types.ObjectId {
    const u = req.user as { _id?: Types.ObjectId };
    return u!._id!;
  }

  /**
   * Maps stored multi-currency goal to flat numbers expected by the web client.
   */
  private mapGoal(g: GoalDocument) {
    const c = (g.currency || 'USD').toUpperCase();
    return {
      _id: g._id,
      title: g.title,
      targetAmount: getAmountInCurrency(g.targetAmount, c),
      currentAmount: getAmountInCurrency(g.currentAmount, c),
      currency: c,
      deadline: g.deadline,
      roomId: g.roomId,
    };
  }

  @Post()
  async create(@Body() dto: CreateGoalDto, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    const doc = await this.goalService.create(userId, {
      title: dto.title,
      targetAmount: dto.targetAmount,
      currency: dto.currency,
      deadline: dto.deadline ? parseLocalDate(dto.deadline) : undefined,
      roomId: dto.roomId ? new Types.ObjectId(dto.roomId) : undefined,
    });
    return this.mapGoal(doc);
  }

  @Get()
  async findAll(
    @Query('roomId') roomId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    const list = await this.goalService.findAll(
      userId,
      roomId ? new Types.ObjectId(roomId) : undefined,
    );
    return list.map((g) => this.mapGoal(g));
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    const doc = await this.goalService.update(id, userId, {
      title: dto.title,
      targetAmount: dto.targetAmount,
      currentAmount: dto.currentAmount,
      deadline:
        dto.deadline !== undefined ? parseLocalDate(dto.deadline) : undefined,
    });
    return doc ? this.mapGoal(doc) : null;
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    await this.goalService.delete(id, userId);
    return { ok: true };
  }
}
