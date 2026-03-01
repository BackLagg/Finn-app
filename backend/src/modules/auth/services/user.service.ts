import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserDocument } from '../../../schemas/user.schema';
import { TelegramUserData } from '../../../middleware/telegram-auth.middleware';
import { MongoErrorUtil } from '../../../utils/mongo-error.util';

@Injectable()
export class UserService {
  constructor(
    @Inject('UserModel')
    private userModel: Model<UserDocument>,
  ) {}

  getUserDisplayName(telegramUser: TelegramUserData): string {
    if (telegramUser.first_name && telegramUser.first_name.trim()) {
      return telegramUser.first_name.trim();
    }
    if (telegramUser.username && telegramUser.username.trim()) {
      return telegramUser.username.trim();
    }
    return 'Anonymous';
  }

  async createBasicUser(
    telegramUser: TelegramUserData,
  ): Promise<UserDocument | null> {
    const telegramID = telegramUser.id.toString();

    try {
      const basicUser = await this.userModel.create({
        telegramID,
        lastLoginAt: new Date(),
      });

      return basicUser;
    } catch (error: unknown) {
      return await MongoErrorUtil.handleDuplicateKeyError(error, () =>
        this.userModel.findOne({ telegramID }).exec(),
      );
    }
  }

  async findOrCreateUser(
    telegramUser: TelegramUserData,
  ): Promise<UserDocument> {
    const telegramID = telegramUser.id.toString();

    let user: UserDocument | null = await this.userModel
      .findOne({ telegramID })
      .exec();

    if (!user) {
      const createdUser = await this.createBasicUser(telegramUser);
      if (!createdUser) {
        throw new Error('Failed to create user');
      }
      user = createdUser;
    }

    return user;
  }

  async updateLastLogin(telegramID: string): Promise<void> {
    const user = await this.userModel.findOne({ telegramID });
    if (user) {
      await this.userModel.findOneAndUpdate(
        { telegramID },
        { lastLoginAt: new Date() },
        { new: true },
      );
    }
  }
}
