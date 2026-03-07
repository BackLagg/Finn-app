import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserProfile, UserProfileSchema } from '../../schemas/user-profile.schema';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../cache/cache.module';
import { SuperUserGuard } from '../../guards/super-user.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserProfile.name, schema: UserProfileSchema },
    ]),
    AuthModule,
    CacheModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SuperUserGuard],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
