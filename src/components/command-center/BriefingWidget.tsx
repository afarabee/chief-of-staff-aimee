import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const suggestionTypeColors: Record<string, string> = {
  reschedule: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  focus: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  unblock: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  idea: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  general: 'bg-muted text-muted-foreground',
};

interface BriefingWidgetProps {
  briefing: any;
  isLoading: boolean;
}

export function BriefingWidget({ briefing, isLoading }: BriefingWidgetProps) {
  return (
    <Card className="md:col-span-2 border-primary/20 bg-primary/5 shadow-md min-w-0 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">AI Daily Briefing</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-5 w-3/5" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-40" />
            </div>
          </div>
        ) : briefing ? (
          <>
            <p className="text-sm text-foreground leading-relaxed">{briefing.summary}</p>
            <div className="flex flex-wrap gap-2">
              {briefing.suggestions.map((s: any, i: number) => (
                <Badge key={i} variant="secondary" className={`text-xs px-3 py-1.5 ${suggestionTypeColors[s.type] || suggestionTypeColors.general}`}>
                  {s.text}
                </Badge>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Unable to load briefing. Try refreshing.</p>
        )}
      </CardContent>
    </Card>
  );
}
