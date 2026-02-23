import { useNavigate } from 'react-router-dom';
import { Sparkles, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAiEnrichments } from '@/hooks/useAiEnrichments';
import { usePageTitle } from '@/hooks/usePageTitle';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

const typeBadge: Record<string, { label: string; className: string }> = {
  task: { label: 'Task', className: 'bg-primary/10 text-primary border-primary/20' },
  idea: { label: 'Idea', className: 'bg-chart-4/20 text-chart-4 border-chart-4/30' },
  reminder: { label: 'Reminder', className: 'bg-chart-2/20 text-chart-2 border-chart-2/30' },
  
};

function useDeleteEnrichment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ai_enrichments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-enrichments'] });
      toast({ title: 'Enrichment deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete', description: error.message, variant: 'destructive' });
    },
  });
}

export default function AiActivity() {
  usePageTitle('AI Activity');
  const [filter, setFilter] = useState('all');
  const { data: enrichments = [], isLoading } = useAiEnrichments(filter);
  const navigate = useNavigate();
  const deleteEnrichment = useDeleteEnrichment();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">AI Activity</h1>
        <p className="text-muted-foreground mt-1">History of all AI enrichments</p>
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
      ) : enrichments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No AI enrichments yet.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Use the "Enrich with AI" button on any task, idea, or reminder to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {enrichments.map((e) => {
            const badge = typeBadge[e.item_type] || typeBadge.task;
            const total = e.suggestions.length;
            const executed = e.suggestions.filter((s) => s.status === 'executed').length;
            const accepted = e.suggestions.filter((s) => s.status === 'accepted').length;
            const dismissed = e.suggestions.filter((s) => s.status === 'dismissed').length;

            let summary = `${total} suggestion${total !== 1 ? 's' : ''}`;
            const parts: string[] = [];
            if (executed > 0) parts.push(`${executed} executed`);
            if (accepted > 0) parts.push(`${accepted} accepted`);
            if (dismissed > 0) parts.push(`${dismissed} dismissed`);
            if (parts.length > 0) summary += ` (${parts.join(', ')})`;

            return (
              <Card
                key={e.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/ai-activity/${e.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                    <span className="text-sm font-medium flex-1 min-w-0 truncate">{e.item_title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {e.created_at ? formatDistanceToNow(new Date(e.created_at), { addSuffix: true }) : ''}
                    </span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(ev) => ev.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this enrichment?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this enrichment record and all its suggestions.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteEnrichment.mutate(e.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{summary}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
