import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  htmlLink: string;
  allDay: boolean;
}

async function fetchTodaysEvents(): Promise<CalendarEvent[]> {
  const { data, error } = await supabase.functions.invoke('get-todays-calendar');
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data?.events || [];
}

export function useTodaysCalendar() {
  return useQuery({
    queryKey: ['todays-calendar'],
    queryFn: fetchTodaysEvents,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 1,
  });
}
