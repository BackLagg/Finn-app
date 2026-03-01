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
import { ShoppingListService } from './shopping-list.service';
import { CreateShoppingListDto } from '../../dto/shopping-list.dto';
import { UpdateShoppingListDto } from '../../dto/shopping-list.dto';
import { UserGuard } from '../../guards/user.guard';
import { AuthenticatedRequest } from '../../interfaces/request.interface';
import { Types } from 'mongoose';

@Controller('shopping-list')
@UseGuards(UserGuard)
export class ShoppingListController {
  constructor(private readonly shoppingListService: ShoppingListService) {}

  private getUserId(req: AuthenticatedRequest): Types.ObjectId {
    const u = req.user as { _id?: Types.ObjectId };
    return u!._id!;
  }

  @Post()
  async create(@Body() dto: CreateShoppingListDto, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.shoppingListService.create(userId, {
      title: dto.title,
      items: dto.items,
      roomId: dto.roomId ? new Types.ObjectId(dto.roomId) : undefined,
    });
  }

  @Get()
  async findAll(
    @Query('roomId') roomId: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    return this.shoppingListService.findAll(
      userId,
      roomId ? new Types.ObjectId(roomId) : undefined,
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateShoppingListDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = this.getUserId(req);
    const data: { title?: string; items?: { name: string; checked: boolean; estimatedPrice?: number }[]; isPinned?: boolean; order?: number } = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.items !== undefined) data.items = dto.items.map((i) => ({ ...i, checked: i.checked ?? false }));
    if (dto.isPinned !== undefined) data.isPinned = dto.isPinned;
    if (dto.order !== undefined) data.order = dto.order;
    return this.shoppingListService.update(id, userId, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    await this.shoppingListService.delete(id, userId);
    return { ok: true };
  }
}
