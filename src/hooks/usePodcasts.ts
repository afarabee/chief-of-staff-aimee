import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PodcastFeed {
  id: string;
  name: string;
  rss_url: string;
  created_at: string;
}

interface PodcastEpisode {
  podcastName: string;
  title: string;
  url: string;
  published: string;
  snippet: string;
}

export function usePodcastFeeds() {
  const queryClient = useQueryClient();

  const feedsQuery = useQuery({
    queryKey: ['podcast-feeds'],
    queryFn: async (): Promise<PodcastFeed[]> => {
      const { data, error } = await supabase
        .from('podcast_feeds' as any)
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as any) ?? [];
    },
  });

  const addFeed = useMutation({
    mutationFn: async ({ name, rss_url }: { name: string; rss_url: string }) => {
      const { error } = await supabase
        .from('podcast_feeds' as any)
        .insert({ name, rss_url } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast-feeds'] });
      queryClient.invalidateQueries({ queryKey: ['podcast-episodes'] });
    },
  });

  const deleteFeed = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('podcast_feeds' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcast-feeds'] });
      queryClient.invalidateQueries({ queryKey: ['podcast-episodes'] });
    },
  });

  return { feeds: feedsQuery.data ?? [], isLoading: feedsQuery.isLoading, addFeed, deleteFeed };
}

export function usePodcastEpisodes() {
  return useQuery({
    queryKey: ['podcast-episodes'],
    queryFn: async (): Promise<PodcastEpisode[]> => {
      const { data, error } = await supabase.functions.invoke('fetch-podcasts');
      if (error) throw error;
      return data?.episodes ?? [];
    },
    staleTime: 30 * 60 * 1000,
  });
}
