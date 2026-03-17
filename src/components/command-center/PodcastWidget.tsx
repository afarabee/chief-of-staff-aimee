import { useState } from 'react';
import { Podcast, Plus, Trash2, ExternalLink, Settings } from 'lucide-react';
import { usePodcastFeeds, usePodcastEpisodes } from '@/hooks/usePodcasts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

export function PodcastWidget({ onRefetchRef }: { onRefetchRef?: React.MutableRefObject<(() => void) | null> }) {
  const { feeds, isLoading: feedsLoading, addFeed, deleteFeed } = usePodcastFeeds();
  const { data: episodes, isLoading: episodesLoading, refetch: refetchEpisodes } = usePodcastEpisodes();
  const [manageOpen, setManageOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');

  // Expose refetch to parent
  if (onRefetchRef) {
    onRefetchRef.current = () => refetchEpisodes();
  }

  const handleAdd = () => {
    if (!newUrl.trim()) return;
    addFeed.mutate(
      { name: 'Auto-detect', rss_url: newUrl.trim() },
      {
        onSuccess: () => {
          setNewUrl('');
          toast({ title: 'Feed added – name will be detected automatically' });
        },
      }
    );
  };

  const isLoading = feedsLoading || episodesLoading;

  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 shadow-md min-w-0 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Podcast className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">My Podcasts</CardTitle>
          </div>
          <Dialog open={manageOpen} onOpenChange={setManageOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="min-h-[44px] gap-1">
                <Settings className="h-4 w-4" /> Manage
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Podcast Feeds</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Current feeds */}
                <div className="space-y-2">
                  {feeds.length === 0 && (
                    <p className="text-sm text-muted-foreground">No feeds yet. Add one below.</p>
                  )}
                  {feeds.map((feed) => (
                    <div key={feed.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{feed.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{feed.rss_url}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive"
                        onClick={() => deleteFeed.mutate(feed.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {/* Add form */}
                <div className="space-y-2 border-t pt-3">
                  <Input
                    placeholder="Podcast name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  <Input
                    placeholder="RSS feed URL"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  />
                  <Button onClick={handleAdd} disabled={!newName.trim() || !newUrl.trim() || addFeed.isPending} className="w-full gap-1">
                    <Plus className="h-4 w-4" /> Add Feed
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : episodes && episodes.length > 0 ? (
          <div className="divide-y divide-border">
            {episodes.slice(0, 8).map((ep, i) => (
              <div key={i} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground leading-snug">{ep.title}</h4>
                    {ep.snippet && <p className="text-xs text-muted-foreground mt-0.5">{ep.snippet}</p>}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{ep.podcastName}</Badge>
                      {ep.published && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(ep.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {ep.url && (
                        <a href={ep.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-0.5">
                          Listen <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : feeds.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">No podcast feeds configured.</p>
            <Button variant="outline" size="sm" onClick={() => setManageOpen(true)} className="gap-1">
              <Plus className="h-4 w-4" /> Add Feeds
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No episodes found. Try refreshing.</p>
        )}
      </CardContent>
    </Card>
  );
}
