import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from './services/user.service';
import { UserProfileService } from './services/user-profile.service';
import { OnboardingService } from './services/onboarding.service';
import { TelegramAuthMiddleware } from '../../middleware/telegram-auth.middleware';
import { CacheModule } from '../cache/cache.module';
import { UserGuard } from '../../guards/user.guard';
import { SuperUserGuard } from '../../guards/super-user.guard';
import { User, UserSchema } from '../../schemas/user.schema';
import { SuperUser, SuperUserSchema } from '../../schemas/superuser.schema';
import {
  UserProfile,
  UserProfileSchema,
} from '../../schemas/user-profile.schema';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: SuperUser.name, schema: SuperUserSchema },
      { name: UserProfile.name, schema: UserProfileSchema },
    ]),
    CacheModule,
    FileModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService,
    UserProfileService,
    OnboardingService,
    TelegramAuthMiddleware,
    UserGuard,
    SuperUserGuard,
  ],
  exports: [AuthService, UserProfileService],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TelegramAuthMiddleware)
      .forRoutes(
        { path: 'auth', method: RequestMethod.POST },
        { path: 'auth/complete-onboarding', method: RequestMethod.POST },
        { path: 'auth/update-profile', method: RequestMethod.PUT },
      );
  }
}
