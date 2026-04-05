import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { ExportService } from './export.service';
import { GenerateExportDto } from '../../dto/export.dto';
import { UserGuard } from '../../guards/user.guard';
import { AuthenticatedRequest } from '../../interfaces/request.interface';
import { Types } from 'mongoose';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  private getUserId(req: AuthenticatedRequest): Types.ObjectId {
    const u = req.user as { _id?: Types.ObjectId };
    return u!._id!;
  }

  @Post('generate')
  @UseGuards(UserGuard)
  async generate(@Body() dto: GenerateExportDto, @Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.exportService.generate(userId, {
      format: dto.format,
      from: dto.from,
      to: dto.to,
      includeCategories: dto.includeCategories,
      includeReceipts: dto.includeReceipts,
      roomId: dto.roomId,
    });
  }

  @Get('history')
  @UseGuards(UserGuard)
  async history(@Req() req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.exportService.history(userId);
  }

  @Get('download/:token')
  @Header('Cache-Control', 'no-store')
  async download(@Param('token') token: string): Promise<StreamableFile> {
    const { data, mimeType } = await this.exportService.getFileByToken(token);
    return new StreamableFile(data, { type: mimeType });
  }
}
