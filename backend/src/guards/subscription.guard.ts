import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequest } from '../interfaces/request.interface';
import { hasActiveSubscription } from '../utils/subscription.util';

export const SUBSCRIPTION_TIER = 'subscriptionTier';
export const RequireSubscription = (tier: 'finn' | 'finn_plus') =>
  SetMetadata(SUBSCRIPTION_TIER, tier);

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTier = this.reflector.getAllAndOverride<'finn' | 'finn_plus'>(
      SUBSCRIPTION_TIER,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredTier) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const profile = request.profile;

    if (!profile || !hasActiveSubscription(profile, requiredTier)) {
      throw new ForbiddenException(
        `Active subscription tier '${requiredTier}' or higher is required`,
      );
    }

    return true;
  }
}
