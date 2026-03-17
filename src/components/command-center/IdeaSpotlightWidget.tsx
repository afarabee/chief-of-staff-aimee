import { Lightbulb, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

interface IdeaSpotlightWidgetProps {
  briefing: any;
  isLoading: boolean;
}

export function IdeaSpotlightWidget({ briefing, isLoading }: IdeaSpotlightWidgetProps) {
  return (
    <Card className="border-violet-200 bg-violet-50 dark:bg-violet-950/30 shadow-md min-w-0 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-violet-500" />
            <CardTitle className="text-lg">Idea Spotlight</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="min-h-[44px]" asChild>
            <Link to="/ideas" className="gap-1">
              All ideas <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-52" />
            </div>
          </div>
        ) : briefing?.ideaSpotlight ? (
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-foreground">{briefing.ideaSpotlight.title}</h3>
              <p className="text-sm text-muted-foreground">{briefing.ideaSpotlight.reason}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Next Steps</p>
              {briefing.ideaSpotlight.steps.map((step: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-200 dark:bg-violet-800 text-xs font-bold text-violet-700 dark:text-violet-200">{i + 1}</span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No idea spotlight available.</p>
        )}
      </CardContent>
    </Card>
  );
}
