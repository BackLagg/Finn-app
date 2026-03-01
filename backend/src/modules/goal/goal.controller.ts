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

@Controller('goal')
@UseGuards(UserGuard)
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  private getUserId(req: AuthenticatedRequest): Types.ObjectId {
    const u = req.user as { _id?: Types.ObjectId };
    return u!._id!;
  }

  @Post()
  async create(@Body() dto: CreateGoalDto, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.goalService.create(userId, {
      title: dto.title,
      targetAmount: dto.targetAmount,
      currency: dto.currency,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      roomId: dto.roomId ? new Types.ObjectId(dto.roomId) : undefined,
    });
  }

  @Get()
  async findAll(
    @Query('roomId') roomId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    return this.goalService.findAll(
      userId,
      roomId ? new Types.ObjectId(roomId) : undefined,
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.targetAmount !== undefined) data.targetAmount = dto.targetAmount;
    if (dto.currentAmount !== undefined) data.currentAmount = dto.currentAmount;
    if (dto.deadline !== undefined) data.deadline = new Date(dto.deadline);
    return this.goalService.update(id, userId, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    await this.goalService.delete(id, userId);
    return { ok: true };
  }
}
