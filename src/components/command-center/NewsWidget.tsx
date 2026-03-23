import { Newspaper, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { NewsArticle } from '@/hooks/useAiNews';
import { openExternalUrl } from '@/lib/openExternalUrl';

interface NewsWidgetProps {
  news: NewsArticle[] | undefined;
  isLoading: boolean;
}

export function NewsWidget({ news, isLoading }: NewsWidgetProps) {
  return (
    <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 shadow-md min-w-0 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-emerald-600" />
          <CardTitle className="text-lg">Top AI News</CardTitle>
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
        ) : news && news.length > 0 ? (
          <div className="divide-y divide-border">
            {news.map((article, i) => {
              const targetUrl = article.url || `https://www.google.com/search?q=${encodeURIComponent(article.title + ' ' + article.source)}`;

              return (
                <div
                  key={i}
                  onClick={() => openExternalUrl(targetUrl)}
                  className="block py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 -mx-2 px-2 rounded-md transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground leading-snug">{article.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{article.snippet}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{article.source}</Badge>
                        <span className="text-xs text-primary inline-flex items-center gap-0.5">
                          {article.url ? 'Read' : 'Search'} <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No news available. Try refreshing.</p>
        )}
      </CardContent>
    </Card>
  );
}
