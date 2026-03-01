import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { FileStorageAdapterService } from '../../services/file-storage-adapter.service';
import * as multer from 'multer';
import { TelegramAuthMiddleware } from '../../middleware/telegram-auth.middleware';
import { CacheModule } from '../cache/cache.module';
import { User, UserSchema } from '../../schemas/user.schema';
import { SuperUser, SuperUserSchema } from '../../schemas/superuser.schema';
import {
  UserProfile,
  UserProfileSchema,
} from '../../schemas/user-profile.schema';
import { AppConstants } from '../../constants/app.constants';

@Module({
  imports: [
    HttpModule, // Для FileStorageAdapterService
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: SuperUser.name, schema: SuperUserSchema },
      { name: UserProfile.name, schema: UserProfileSchema },
    ]),
    CacheModule, // Нужен для TelegramAuthMiddleware
  ],
  controllers: [FileController],
  providers: [FileService, FileStorageAdapterService],
  exports: [FileService],
})
export class FileModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    const memoryStorage = multer.memoryStorage();

    consumer
      .apply(
        multer({
          storage: memoryStorage,
          limits: { fileSize: AppConstants.FILE_SIZE.LIMITS.IMAGE },
        }).single('image'),
        TelegramAuthMiddleware,
      )
      .forRoutes('file/upload-product-image');

    consumer
      .apply(
        multer({
          storage: memoryStorage,
          limits: { fileSize: AppConstants.FILE_SIZE.LIMITS.AVATAR },
        }).single('avatar'),
        TelegramAuthMiddleware,
      )
      .forRoutes('file/upload-avatar');

    consumer
      .apply(
        multer({
          storage: memoryStorage,
          limits: { fileSize: AppConstants.FILE_SIZE.LIMITS.IMAGE },
        }).single('file'),
        TelegramAuthMiddleware,
      )
      .forRoutes('file/upload-receipt');

    consumer
      .apply(
        multer({
          storage: memoryStorage,
          limits: { fileSize: AppConstants.FILE_SIZE.LIMITS.DOCUMENT },
        }).single('document'),
        TelegramAuthMiddleware,
      )
      .forRoutes('file/upload-document');
  }
}
