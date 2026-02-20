import { useState } from 'react';
import { Sparkles, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAllAiExecutions } from '@/hooks/useAllAiExecutions';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';

const typeBadge: Record<string, { label: string; className: string }> = {
  task: { label: 'Task', className: 'bg-primary/10 text-primary border-primary/20' },
  idea: { label: 'Idea', className: 'bg-chart-4/20 text-chart-4 border-chart-4/30' },
  reminder: { label: 'Reminder', className: 'bg-chart-2/20 text-chart-2 border-chart-2/30' },
};

export default function AiActivity() {
  usePageTitle('AI Activity');
  const [filter, setFilter] = useState('all');
  const { data: executions = [], isLoading } = useAllAiExecutions(filter);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">AI Activity</h1>
        <p className="text-muted-foreground mt-1">History of all AI-executed suggestions</p>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="task">Tasks</TabsTrigger>
          <TabsTrigger value="idea">Ideas</TabsTrigger>
          <TabsTrigger value="reminder">Reminders</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : executions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No AI suggestions have been executed yet.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Use the "Enrich with AI" button on any task, idea, or reminder to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <TooltipProvider>
            {executions.map((exec) => {
              const badge = typeBadge[exec.item_type] || typeBadge.task;
              const isOpen = openItems.has(exec.id);
              const preview = exec.result.length > 100 ? exec.result.slice(0, 100) + '…' : exec.result;

              return (
                <Card key={exec.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                      <span className="text-sm font-medium">{exec.item_title}</span>
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">
                        {formatDistanceToNow(new Date(exec.created_at!), { addSuffix: true })}
                      </span>
                    </div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm text-muted-foreground truncate">{exec.suggestion}</p>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="text-sm">{exec.suggestion}</p>
                      </TooltipContent>
                    </Tooltip>

                    <Collapsible open={isOpen} onOpenChange={() => toggle(exec.id)}>
                      {!isOpen && (
                        <p className="text-xs text-muted-foreground/70">{preview}</p>
                      )}
                      <CollapsibleTrigger asChild>
                        <Button type="button" variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs text-muted-foreground gap-1">
                          {isOpen ? <><ChevronUp className="h-3 w-3" /> Hide</> : <><ChevronDown className="h-3 w-3" /> Show more</>}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 bg-muted/50 rounded-md p-3">
                          <div className="flex items-center justify-end mb-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                navigator.clipboard.writeText(exec.result);
                                toast({ title: 'Copied to clipboard' });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{exec.result}</p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              );
            })}
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
