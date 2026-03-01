import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { Response, NextFunction } from 'express';
import { ConfigType } from '@nestjs/config';
import * as crypto from 'crypto';
import { UserDocument } from '../schemas/user.schema';
import { AuthenticatedRequest } from '../interfaces/request.interface';
import { UserFullData } from '../interfaces/user-data.interface';
import appConfig from '../config/app.config';
import { CacheService } from '../modules/cache/cache.service';
import { AppConstants } from '../constants/app.constants';

export interface TelegramUserData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

@Injectable()
export class TelegramAuthMiddleware implements NestMiddleware {
  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
    @Inject('UserModel') private userModel: Model<UserDocument>,
    private readonly cacheService: CacheService,
  ) {}

  private async getUserDataOptimized(
    telegramID: string,
  ): Promise<UserFullData | null> {
    const cacheKey = telegramID;

    const cached = await this.cacheService.getFromCache<UserFullData>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.userModel
      .aggregate([
        { $match: { telegramID } },
        {
          $lookup: {
            from: 'userprofiles',
            localField: '_id',
            foreignField: 'userId',
            as: 'profiles',
          },
        },
        {
          $lookup: {
            from: 'superusers',
            localField: '_id',
            foreignField: 'userId',
            as: 'superUsers',
          },
        },
        {
          $project: {
            _id: 1,
            id: { $toString: '$_id' },
            telegramID: 1,
            isAccepted: 1,
            createdAt: 1,
            lastLoginAt: 1,
            updatedAt: 1,
            profile: {
              $cond: {
                if: { $gt: [{ $size: '$profiles' }, 0] },
                then: { $arrayElemAt: ['$profiles', 0] },
                else: null,
              },
            },
            superUser: {
              $cond: {
                if: { $gt: [{ $size: '$superUsers' }, 0] },
                then: { $arrayElemAt: ['$superUsers', 0] },
                else: null,
              },
            },
          },
        },
      ])
      .exec();

    const userData = (result[0] as UserFullData | undefined) || null;

    if (userData) {
      const tags = this.generateCacheTags(userData);
      const ttl = this.getCacheDuration(userData);
      await this.cacheService.setToCache(cacheKey, userData, ttl, tags);
    }

    return userData;
  }

  private getCacheDuration(userData: UserFullData): number {
    const candidateDates: number[] = [];
    if (userData.updatedAt)
      candidateDates.push(new Date(userData.updatedAt).getTime());
    if (userData.lastLoginAt)
      candidateDates.push(new Date(userData.lastLoginAt).getTime());
    if (userData.profile?.updatedAt)
      candidateDates.push(new Date(userData.profile.updatedAt).getTime());

    if (candidateDates.length === 0) {
      return (
        AppConstants.CACHE.TTL_BY_ACTIVITY.DEFAULT_MINUTES *
        AppConstants.TIME.MILLISECONDS.MINUTE
      );
    }

    const lastUpdate = Math.max(...candidateDates);
    const now = Date.now();
    const timeSinceUpdate = now - lastUpdate;

    if (userData.superUser) {
      if (
        timeSinceUpdate <
        AppConstants.CACHE.TTL_BY_ACTIVITY.RECENTLY_UPDATED_MINUTES *
          AppConstants.TIME.MILLISECONDS.MINUTE
      ) {
        return (
          AppConstants.CACHE.TTL_BY_ACTIVITY.ACTIVE_USER_MINUTES *
          AppConstants.TIME.MILLISECONDS.MINUTE
        );
      } else if (timeSinceUpdate < AppConstants.TIME.MILLISECONDS.HOUR) {
        return (
          AppConstants.CACHE.TTL_BY_ACTIVITY.RECENTLY_UPDATED_MINUTES *
          AppConstants.TIME.MILLISECONDS.MINUTE
        );
      } else {
        return (
          AppConstants.CACHE.TTL_BY_ACTIVITY.RECENTLY_UPDATED_HOURS *
          AppConstants.TIME.MILLISECONDS.MINUTE
        );
      }
    } else if (userData.profile?.isNew) {
      return (
        AppConstants.CACHE.TTL_BY_ACTIVITY.INACTIVE_USER_MINUTES *
        AppConstants.TIME.MILLISECONDS.MINUTE
      );
    } else if (userData.isAccepted) {
      if (
        timeSinceUpdate <
        AppConstants.CACHE.TTL_BY_ACTIVITY.RECENTLY_UPDATED_MINUTES *
          AppConstants.TIME.MILLISECONDS.MINUTE
      ) {
        return (
          AppConstants.CACHE.TTL_BY_ACTIVITY.INACTIVE_RECENT_MINUTES *
          AppConstants.TIME.MILLISECONDS.MINUTE
        );
      } else if (timeSinceUpdate < AppConstants.TIME.MILLISECONDS.HOUR) {
        return (
          AppConstants.CACHE.TTL_BY_ACTIVITY.INACTIVE_RECENT_HOURS *
          AppConstants.TIME.MILLISECONDS.MINUTE
        );
      } else {
        return (
          AppConstants.CACHE.TTL_BY_ACTIVITY.INACTIVE_OLD_MINUTES *
          AppConstants.TIME.MILLISECONDS.MINUTE
        );
      }
    } else {
      return (
        AppConstants.CACHE.TTL_BY_ACTIVITY.DEFAULT_MINUTES *
        AppConstants.TIME.MILLISECONDS.MINUTE
      );
    }
  }

  private generateCacheTags(userData: UserFullData): string[] {
    const tags: string[] = [];
    const userId =
      (userData as { id?: string; _id?: unknown }).id ??
      String(
        (userData as { _id?: { toString: () => string } })._id?.toString?.() ??
          '',
      );
    if (userId) {
      tags.push(`user:${userId}`);
    }
    tags.push('user_data');

    if (userData.isAccepted) {
      tags.push('accepted_users');
    } else {
      tags.push('pending_users');
    }

    if (userData.profile) {
      tags.push('users_with_profile');

      if (userData.profile.isNew) {
        tags.push('new_profiles');
      } else {
        tags.push('completed_profiles');
      }
    } else {
      tags.push('users_without_profile');
    }

    if (userData.superUser) {
      tags.push('super_users');
    } else {
      tags.push('regular_users');
    }

    const now = Date.now();
    const lastLogin = userData.lastLoginAt
      ? new Date(userData.lastLoginAt).getTime()
      : 0;
    const timeSinceLogin = now - lastLogin;

    if (
      timeSinceLogin <
      AppConstants.TELEGRAM.CACHE.ACTIVE_USER_DAYS *
        AppConstants.TIME.MILLISECONDS.DAY
    ) {
      tags.push('active_users');
    } else if (
      timeSinceLogin <
      AppConstants.TELEGRAM.CACHE.RECENT_USER_DAYS *
        AppConstants.TIME.MILLISECONDS.DAY
    ) {
      tags.push('recent_users');
    } else {
      tags.push('inactive_users');
    }

    if (userData.profile?.isNew) {
      tags.push('new_users');
    }

    if (userData.createdAt) {
      const createdAt = new Date(userData.createdAt).getTime();
      const timeSinceCreation = now - createdAt;
      if (
        timeSinceCreation <
        AppConstants.TELEGRAM.CACHE.NEW_USER_DAYS *
          AppConstants.TIME.MILLISECONDS.DAY
      ) {
        tags.push('recent_registrations');
      }
    }

    return tags;
  }

  private validateInitData(
    initData: string,
    botToken: string,
  ): Record<string, string> | null {
    try {
      if (!initData || typeof initData !== 'string') {
        return null;
      }

      if (!botToken || typeof botToken !== 'string') {
        return null;
      }

      let decodedInitData: string;
      try {
        decodedInitData = decodeURIComponent(initData);
      } catch {
        return null;
      }

      if (!decodedInitData || decodedInitData.trim().length === 0) {
        return null;
      }

      // Парсим вручную, так как URLSearchParams может неправильно обработать значения со специальными символами
      const data: Record<string, string> = {};
      const pairs = decodedInitData.split('&');

      for (const pair of pairs) {
        // Находим первое '=' - это разделитель ключа и значения
        const equalIndex = pair.indexOf('=');
        if (equalIndex === -1) {
          // Пропускаем пары без '='
          continue;
        }

        const key = pair.substring(0, equalIndex);
        const value = pair.substring(equalIndex + 1);

        // Если ключ уже есть, это может быть ошибка парсинга, но берем последнее значение
        data[key] = value;
      }

      if (!data.hash) {
        return null;
      }

      if (!data.user) {
        return null;
      }

      const { hash, ...userData } = data;

      if (Object.keys(userData).length === 0) {
        return null;
      }

      const checkString = Object.keys(userData)
        .sort()
        .map((key) => `${key}=${userData[key]}`)
        .join('\n');

      const secretKey = crypto
        .createHmac(
          AppConstants.TELEGRAM.AUTH.HMAC_ALGORITHM,
          AppConstants.TELEGRAM.AUTH.SECRET_KEY_PREFIX,
        )
        .update(botToken)
        .digest();

      const hmac = crypto
        .createHmac(AppConstants.TELEGRAM.AUTH.HMAC_ALGORITHM, secretKey)
        .update(checkString)
        .digest('hex');

      if (hmac !== hash) {
        return null;
      }

      return userData;
    } catch {
      return null;
    }
  }

  async use(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Проверяем источники initData
      const initDataFromBody = (req.body as { initData?: string })?.initData;
      const initDataFromHeader = req.headers['x-init-data'] as
        | string
        | undefined;
      const initData = initDataFromBody || initDataFromHeader;

      if (!initData) {
        res.status(400).json({
          success: false,
          error: 'initData is required',
        });
        return;
      }

      if (!this.appConfiguration.botToken) {
        res.status(500).json({
          success: false,
          error: 'Bot token not configured',
        });
        return;
      }

      const userData = this.validateInitData(
        initData as string,
        this.appConfiguration.botToken,
      );

      if (!userData) {
        res.status(401).json({
          success: false,
          error: 'Invalid signature',
        });
        return;
      }

      // Проверка времени жизни initData (auth_date)
      // Важно: initData не хранится на сервере, но проверка auth_date предотвращает
      // использование старых, возможно перехваченных токенов
      if (userData.auth_date) {
        const authDate = parseInt(userData.auth_date, 10);
        if (!isNaN(authDate)) {
          const now = Math.floor(Date.now() / 1000);
          const tokenAge = now - authDate;

          if (tokenAge > AppConstants.TELEGRAM.AUTH.MAX_TOKEN_AGE_SECONDS) {
            res.status(401).json({
              success: false,
              error: 'Token expired',
            });
            return;
          }
        }
      }

      let telegramUser: TelegramUserData;
      try {
        telegramUser = JSON.parse(userData.user) as TelegramUserData;
      } catch {
        res.status(401).json({
          success: false,
          error: 'Invalid user data',
        });
        return;
      }

      if (!telegramUser || !telegramUser.id) {
        res.status(401).json({
          success: false,
          error: 'Invalid user data',
        });
        return;
      }

      const telegramID = telegramUser.id.toString();

      const startappParam =
        userData.startapp ||
        (req.query.tgWebAppStartParam as string | undefined) ||
        (req.body as { tgWebAppStartParam?: string })?.tgWebAppStartParam;

      const userFullData = await this.getUserDataOptimized(telegramID);

      req.telegramUser = telegramUser;
      req.user = userFullData || undefined;
      req.profile = userFullData?.profile || undefined;
      req.superUser = userFullData?.superUser || undefined;
      req.startappParam = startappParam;

      next();
    } catch {
      res.status(500).json({
        success: false,
        error: 'Server error',
      });
      return;
    }
  }
}
