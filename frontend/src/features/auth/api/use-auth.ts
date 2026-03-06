import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authAPI, getInitData } from '@shared/api';
import type { UpdateProfilePayload } from '@shared/api/auth-api';
import { handleError } from '@shared/lib';
import { useDispatch } from 'react-redux';
import { setUserData } from '@app/store';
import { setAdminStatus } from '@app/store';
import type { User } from '@shared/types';

export const useAuth = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  // Авторизация
  const authQuery = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async (): Promise<User | null> => {
      window?.Telegram?.WebApp?.ready();
      const initData = getInitData();
      
      if (!initData) {
        throw new Error('Telegram WebApp не инициализирован');
      }

      const response = await authAPI.authenticate(initData);
      
      if (response.success && response.user) {
        const userData = response.user;
        dispatch(setUserData(userData));
        dispatch(setAdminStatus(userData.role === 'superuser'));
        return userData;
      }
      
      throw new Error('Ошибка авторизации');
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут
  });

  // Завершение онбординга
  const completeOnboardingMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const initData = getInitData();
      const response = await authAPI.completeOnboarding(initData, data);
      
      if (response.success && response.user) {
        dispatch(setUserData(response.user));
        dispatch(setAdminStatus(response.user.role === 'superuser'));
        queryClient.setQueryData(['auth', 'user'], response.user);
        return response.user;
      }
      
      throw new Error('Ошибка завершения онбординга');
    },
    onError: (error) => {
      handleError(error);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfilePayload) => {
      const initData = getInitData();
      const response = await authAPI.updateProfile(initData, data);
      
      if (response.success && response.user) {
        dispatch(setUserData(response.user));
        queryClient.setQueryData(['auth', 'user'], response.user);
        return response.user;
      }
      
      throw new Error('Ошибка обновления профиля');
    },
    onError: (error) => {
      handleError(error);
    },
  });

  const user = authQuery.data || null;
  const isAuthenticated = !!user?.id && !authQuery.error;
  const isNewUser = !!(user?.id && user?.isNew);

  return {
    user,
    isLoading: authQuery.isLoading,
    error: authQuery.error ? handleError(authQuery.error, false) : null,
    isAuthenticated,
    isNewUser,
    refetch: authQuery.refetch,
    completeOnboarding: completeOnboardingMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    isCompletingOnboarding: completeOnboardingMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
  };
};

