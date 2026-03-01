import {
  Controller,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Body,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserGuard } from '../../guards/user.guard';
import { AuthenticatedRequest } from '../../interfaces/request.interface';
import { FileService } from './file.service';
import { AppConstants } from '../../constants/app.constants';
import { MulterRequest } from '../../interfaces/multer.interface';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload-product-image')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UserGuard)
  async uploadProductImage(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; imageUrl: string; filename: string }> {
    const file = (req as MulterRequest).file;

    if (!file) {
      throw new BadRequestException({
        message: 'No file uploaded',
        errorCode: 'NO_FILE_UPLOADED',
      });
    }

    try {
      // Валидация типа файла
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        throw new BadRequestException({
          message: 'Invalid file type',
          errorCode: 'INVALID_FILE_TYPE',
        });
      }

      // Валидация размера
      if (file.size > AppConstants.FILE_SIZE.LIMITS.IMAGE) {
        throw new BadRequestException({
          message: 'File size exceeds limit',
          errorCode: 'FILE_TOO_LARGE',
        });
      }

      const result = await this.fileService.uploadFile(
        file.buffer,
        file.originalname,
        'products',
        file.mimetype,
        'product',
      );

      return {
        success: true,
        imageUrl: result.url,
        filename: result.filename,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Failed to upload file',
        errorCode: 'UPLOAD_ERROR',
      });
    }
  }

  @Post('upload-avatar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UserGuard)
  async uploadAvatar(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; imageUrl: string; filename: string }> {
    const file = (req as MulterRequest).file;

    if (!file) {
      throw new BadRequestException({
        message: 'No file uploaded',
        errorCode: 'NO_FILE_UPLOADED',
      });
    }

    try {
      // Валидация типа файла
      if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
        throw new BadRequestException({
          message: 'Invalid file type',
          errorCode: 'INVALID_FILE_TYPE',
        });
      }

      // Валидация размера
      if (file.size > AppConstants.FILE_SIZE.LIMITS.AVATAR) {
        throw new BadRequestException({
          message: 'File size exceeds limit',
          errorCode: 'FILE_TOO_LARGE',
        });
      }

      const result = await this.fileService.uploadFile(
        file.buffer,
        file.originalname,
        'avatars',
        file.mimetype,
        'avatar',
      );

      return {
        success: true,
        imageUrl: result.url,
        filename: result.filename,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Failed to upload file',
        errorCode: 'UPLOAD_ERROR',
      });
    }
  }

  @Post('upload-receipt')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UserGuard)
  async uploadReceipt(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; imageUrl: string; filename: string }> {
    const file = (req as MulterRequest).file;

    if (!file) {
      throw new BadRequestException({
        message: 'No file uploaded',
        errorCode: 'NO_FILE_UPLOADED',
      });
    }

    try {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        throw new BadRequestException({
          message: 'Invalid file type',
          errorCode: 'INVALID_FILE_TYPE',
        });
      }

      if (file.size > AppConstants.FILE_SIZE.LIMITS.IMAGE) {
        throw new BadRequestException({
          message: 'File size exceeds limit',
          errorCode: 'FILE_TOO_LARGE',
        });
      }

      const result = await this.fileService.uploadFile(
        file.buffer,
        file.originalname,
        'receipts',
        file.mimetype,
        'receipt',
      );

      return {
        success: true,
        imageUrl: result.url,
        filename: result.filename,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Failed to upload file',
        errorCode: 'UPLOAD_ERROR',
      });
    }
  }

  @Post('upload-document')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UserGuard)
  async uploadDocument(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; fileUrl: string; filename: string }> {
    const file = (req as MulterRequest).file;

    if (!file) {
      throw new BadRequestException({
        message: 'No file uploaded',
        errorCode: 'NO_FILE_UPLOADED',
      });
    }

    try {
      // Валидация типа файла
      if (!file.mimetype.match(/\/(pdf|doc|docx)$/)) {
        throw new BadRequestException({
          message: 'Invalid file type',
          errorCode: 'INVALID_FILE_TYPE',
        });
      }

      // Валидация размера
      if (file.size > AppConstants.FILE_SIZE.LIMITS.DOCUMENT) {
        throw new BadRequestException({
          message: 'File size exceeds limit',
          errorCode: 'FILE_TOO_LARGE',
        });
      }

      const result = await this.fileService.uploadFile(
        file.buffer,
        file.originalname,
        'documents',
        file.mimetype,
        'doc',
      );

      return {
        success: true,
        fileUrl: result.url,
        filename: result.filename,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Failed to upload file',
        errorCode: 'UPLOAD_ERROR',
      });
    }
  }

  @Delete('delete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(UserGuard)
  async deleteFile(
    @Body() body: { filePath: string },
  ): Promise<{ success: boolean }> {
    if (!body.filePath) {
      throw new BadRequestException({
        message: 'Invalid file path',
        errorCode: 'INVALID_FILE_PATH',
      });
    }

    try {
      const deleted = await this.fileService.deleteFile(body.filePath);
      if (!deleted) {
        throw new InternalServerErrorException({
          message: 'Failed to delete file',
          errorCode: 'DELETE_FILE_ERROR',
        });
      }

      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Error deleting file',
        errorCode: 'DELETE_FILE_ERROR',
      });
    }
  }
}
