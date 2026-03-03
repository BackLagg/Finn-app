import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeAPI, type Reminder } from '@shared/api';

function toReminderWithId(r: Reminder): Reminder & { id: string } {
  return { ...r, id: r._id };
}

export function useReminders(roomId?: string, year?: number, month?: number) {
  const queryClient = useQueryClient();
  const from =
    year !== undefined && month !== undefined
      ? new Date(year, month, 1).toISOString().slice(0, 10)
      : undefined;
  const to =
    year !== undefined && month !== undefined
      ? new Date(year, month + 1, 0).toISOString().slice(0, 10)
      : undefined;

  const query = useQuery({
    queryKey: ['reminders', roomId, from, to],
    queryFn: async () => {
      const res = await financeAPI.reminders.list({ roomId, from, to });
      const data = res.data ?? [];
      return data.map(toReminderWithId);
    },
    enabled: from !== undefined && to !== undefined,
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      amount: number;
      currency?: string;
      description?: string;
      date: string;
      dayOfMonth: number;
      isRecurring?: boolean;
      roomId?: string;
    }) => financeAPI.reminders.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', roomId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeAPI.reminders.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', roomId] });
    },
  });

  const reminders = (query.data ?? []) as (Reminder & { id: string })[];
  return {
    reminders,
    isLoading: query.isLoading,
    create: createMutation.mutate,
    deleteReminder: deleteMutation.mutate,
  };
}
