import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TaskToCalendarParams {
  summary: string;
  description: string;
  startDate: string;
  startTime: string;
  timeZone: string;
  reminders: number[];
}

export function useTaskToCalendar() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ summary, description, startDate, startTime, timeZone, reminders }: TaskToCalendarParams) => {
      const { data, error } = await supabase.functions.invoke('create-calendar-event', {
        body: {
          summary,
          description,
          start_date: startDate,
          start_time: startTime,
          time_zone: timeZone,
          reminders,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Added to Google Calendar!',
        description: data?.htmlLink ? 'Event created successfully.' : undefined,
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Failed to add to calendar',
        description: err.message,
        variant: 'destructive',
      });
    },
  });
}
