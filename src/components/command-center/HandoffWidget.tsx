import { RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HandoffSummary } from '@/hooks/useHandoffSummaries';

interface HandoffWidgetProps {
  summaries: HandoffSummary[] | undefined;
  isLoading: boolean;
}

export function HandoffWidget({ summaries, isLoading }: HandoffWidgetProps) {
  return (
    <Card className="border-rose-200 bg-rose-50 dark:bg-rose-950/30 shadow-md min-w-0 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-rose-500" />
          <CardTitle className="text-lg">Handoff Scanner</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : summaries && summaries.length > 0 ? (
          <div className="divide-y divide-border">
            {summaries.map((s, i) => (
              <div key={i} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                <h4 className="text-sm font-semibold text-foreground">{s.project_name}</h4>
                {s.tools?.length > 0 && (
                  <p className="text-xs text-muted-foreground">Tools: {s.tools.join(', ')}</p>
                )}
                {s.completed?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Completed:</p>
                    {s.completed.map((item, j) => (
                      <p key={j} className="text-xs text-foreground pl-2">• {item}</p>
                    ))}
                  </div>
                )}
                {s.next_steps?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Pick up here:</p>
                    {s.next_steps.map((step, j) => (
                      <p key={j} className="text-xs text-foreground pl-2">➡️ {step}</p>
                    ))}
                  </div>
                )}
                {s.resume_command && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-1">{s.resume_command}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recent handoff notes.</p>
        )}
      </CardContent>
    </Card>
  );
}
