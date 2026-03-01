import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';

export function useTransactions(roomId?: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['transactions', roomId],
    queryFn: async () => {
      const res = await financeAPI.transactions.list({ roomId });
      return res.data;
    },
  });
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof financeAPI.transactions.create>[0]) => financeAPI.transactions.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions', roomId] }),
  });
  return {
    transactions: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    create: createMutation.mutate,
  };
}
