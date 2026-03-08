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
import { PlanService } from './plan.service';
import { CreatePlanDto } from '../../dto/plan.dto';
import { UpdatePlanDto } from '../../dto/plan.dto';
import { UserGuard } from '../../guards/user.guard';
import { AuthenticatedRequest } from '../../interfaces/request.interface';
import { Types } from 'mongoose';
import { parseLocalDate } from '../../utils/date.util';

@Controller('plan')
@UseGuards(UserGuard)
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  private getUserId(req: AuthenticatedRequest): Types.ObjectId {
    const u = req.user as { _id?: Types.ObjectId };
    return u!._id!;
  }

  @Post()
  async create(@Body() dto: CreatePlanDto, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.planService.create(userId, {
      name: dto.name,
      amount: dto.amount,
      dayOfMonth: dto.dayOfMonth,
      savingFor: dto.savingFor,
      category: dto.category,
      roomId: dto.roomId ? new Types.ObjectId(dto.roomId) : undefined,
      deadline: dto.deadline ? parseLocalDate(dto.deadline) : undefined,
      savingsPercent: dto.savingsPercent,
    });
  }

  @Get()
  async findAll(
    @Query('roomId') roomId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    return this.planService.findAll(
      userId,
      roomId ? new Types.ObjectId(roomId) : undefined,
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.dayOfMonth !== undefined) data.dayOfMonth = dto.dayOfMonth;
    if (dto.savingFor !== undefined) data.savingFor = dto.savingFor;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.deadline !== undefined) data.deadline = parseLocalDate(dto.deadline);
    if (dto.savingsPercent !== undefined) data.savingsPercent = dto.savingsPercent;
    if (dto.completedAt !== undefined) data.completedAt = new Date(dto.completedAt);
    return this.planService.update(id, userId, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    await this.planService.delete(id, userId);
    return { ok: true };
  }
}
