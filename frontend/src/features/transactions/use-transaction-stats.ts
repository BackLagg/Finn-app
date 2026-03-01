import { useQuery } from '@tanstack/react-query';
import { financeAPI } from '@shared/api';

export function useTransactionStats(roomId?: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ['transaction-stats', roomId, from, to],
    queryFn: async () => {
      const res = await financeAPI.transactions.stats({ roomId, from, to });
      return res.data;
    },
  });
}
