import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { UserProfileDocument } from '../../../schemas/user-profile.schema';
import { TelegramUserData } from '../../../middleware/telegram-auth.middleware';
import { UpdateUserProfileDto } from '../../../dto/user-profile.dto';
import { FileService } from '../../file/file.service';
import { CacheService } from '../../cache/cache.service';
import { MongoErrorUtil } from '../../../utils/mongo-error.util';
import { UserService } from './user.service';

@Injectable()
export class UserProfileService {
  private readonly logger = new Logger(UserProfileService.name);

  constructor(
    @Inject('UserProfileModel')
    private userProfileModel: Model<UserProfileDocument>,
    private fileService: FileService,
    private cacheService: CacheService,
    private userService: UserService,
  ) {}

  async createBasicProfile(
    userId: import('mongoose').Types.ObjectId,
    telegramUser: TelegramUserData,
  ): Promise<UserProfileDocument | null> {
    try {
      const basicProfile = await this.userProfileModel.create({
        userId,
        name: this.userService.getUserDisplayName(telegramUser),
        username: telegramUser.username || null,
        isNew: true,
      });
      return basicProfile;
    } catch (error: unknown) {
      return await MongoErrorUtil.handleDuplicateKeyError(error, () =>
        this.userProfileModel.findOne({ userId }).exec(),
      );
    }
  }

  async findOrCreateProfile(
    telegramUser: TelegramUserData,
  ): Promise<UserProfileDocument> {
    const user = await this.userService.findOrCreateUser(telegramUser);
    const userId = user._id;

    let profile: UserProfileDocument | null = await this.userProfileModel
      .findOne({ userId })
      .exec();

    if (!profile) {
      const createdProfile = await this.createBasicProfile(
        userId,
        telegramUser,
      );
      if (!createdProfile) {
        throw new Error('Failed to create profile');
      }
      profile = createdProfile;
    }

    return profile;
  }

  async findProfileByUserId(
    userId: Types.ObjectId,
  ): Promise<UserProfileDocument | null> {
    return this.userProfileModel.findOne({ userId }).exec();
  }

  async processUserAvatar(
    telegramUser: TelegramUserData,
    currentProfile?: UserProfileDocument | null,
  ): Promise<string | null> {
    try {
      const newAvatarPath =
        await this.fileService.downloadTelegramAvatar(telegramUser);

      if (!newAvatarPath) {
        return null;
      }

      // Удаляем старую аватарку если есть
      if (
        currentProfile?.avatarPath &&
        currentProfile.avatarPath !== newAvatarPath
      ) {
        setImmediate(async () => {
          const oldAvatarDeleted = await this.fileService.deleteFile(
            currentProfile.avatarPath,
          );
          if (!oldAvatarDeleted) {
            this.logger.warn(
              `Failed to delete old avatar: ${currentProfile.avatarPath}`,
            );
          }
        });
      }

      // Обновляем профиль с новой аватаркой
      if (newAvatarPath && currentProfile?.userId) {
        await this.updateProfile(currentProfile.userId, {
          avatarPath: newAvatarPath,
        });
      }

      return newAvatarPath;
    } catch (error) {
      this.logger.error('Error processing user avatar:', error);
      return null;
    }
  }

  async updateProfile(
    userId: Types.ObjectId | string,
    updateData: Partial<UserProfileDocument>,
  ): Promise<UserProfileDocument> {
    const id = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const profile = await this.userProfileModel.findOneAndUpdate(
      { userId: id },
      updateData,
      { new: true },
    );
    if (!profile) {
      throw new Error('Profile not found');
    }
    return profile;
  }

  async updateUserProfile(
    telegramUser: TelegramUserData,
    updateProfileDto: UpdateUserProfileDto,
    existingProfile?: UserProfileDocument | null,
  ): Promise<void> {
    let profile = existingProfile;
    if (!profile) {
      profile = await this.findOrCreateProfile(telegramUser);
    }
    const userId = profile.userId;

    const updateData: Partial<{
      name?: string;
      username?: string;
      bio?: string;
      avatarPath?: string;
      isNew?: boolean;
    }> = {};

    if (updateProfileDto.name !== undefined) {
      updateData.name = updateProfileDto.name;
    }

    const avatarPath = await this.processUserAvatar(telegramUser, profile);
    if (avatarPath) {
      updateData.avatarPath = avatarPath;
    }

    if (Object.keys(updateData).length > 0) {
      await this.updateProfile(userId, updateData);
      await this.cacheService.invalidateByTags([`user:${userId}`]);
    }
  }
}
