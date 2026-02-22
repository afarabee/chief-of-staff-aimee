import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, ListPlus, X, Copy, Check, Loader2, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAiEnrichment } from '@/hooks/useAiEnrichment';
import { useUpdateEnrichmentSuggestion } from '@/hooks/useUpdateEnrichmentSuggestion';
import { useExecuteSuggestion } from '@/hooks/useExecuteSuggestion';
import { useCreateSubtask } from '@/hooks/useCreateSubtask';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';

const typeBadge: Record<string, { label: string; className: string }> = {
  task: { label: 'Task', className: 'bg-primary/10 text-primary border-primary/20' },
  idea: { label: 'Idea', className: 'bg-chart-4/20 text-chart-4 border-chart-4/30' },
  reminder: { label: 'Reminder', className: 'bg-chart-2/20 text-chart-2 border-chart-2/30' },
  asset: { label: 'Asset', className: 'bg-chart-1/20 text-chart-1 border-chart-1/30' },
};

function renderResultMarkdown(text: string) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<strong class="text-sm">$1</strong>')
    .replace(/^## (.+)$/gm, '<strong class="text-sm">$1</strong>')
    .replace(/^# (.+)$/gm, '<strong class="text-base">$1</strong>')
    .replace(/^[-•] (.+)$/gm, '<li class="ml-4">• $1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n/g, '<br/>');
}

export default function AiEnrichmentDetail() {
  usePageTitle('Enrichment Detail');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: enrichment, isLoading } = useAiEnrichment(id);
  const updateSuggestion = useUpdateEnrichmentSuggestion();
  const executeSuggestion = useExecuteSuggestion();
  const createSubtask = useCreateSubtask();
  const [executingIdx, setExecutingIdx] = useState<number | null>(null);
  const [createdSubtaskIdx, setCreatedSubtaskIdx] = useState<Set<number>>(new Set());
  const [showDismissed, setShowDismissed] = useState(false);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!enrichment) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/ai-activity')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to AI Activity
        </Button>
        <p className="text-muted-foreground">Enrichment not found.</p>
      </div>
    );
  }

  const badge = typeBadge[enrichment.item_type] || typeBadge.task;
  const suggestions = enrichment.suggestions || [];
  const visibleSuggestions = showDismissed
    ? suggestions
    : suggestions.filter((s) => s.status !== 'dismissed');
  const dismissedCount = suggestions.filter((s) => s.status === 'dismissed').length;

  const handleExecute = async (idx: number, suggestion: string) => {
    setExecutingIdx(idx);
    try {
      const result = await executeSuggestion.mutateAsync({
        suggestion,
        item_type: enrichment.item_type as 'task' | 'idea' | 'reminder' | 'asset',
        item_title: enrichment.item_title,
        item_description: '',
        item_id: enrichment.item_id,
        suggestion_index: idx,
      });

      await updateSuggestion.mutateAsync({
        enrichmentId: enrichment.id,
        suggestionIndex: idx,
        updates: { status: 'executed', result },
      });
    } catch {
      // Error handled by hook
    } finally {
      setExecutingIdx(null);
    }
  };

  const handleDismiss = async (idx: number) => {
    await updateSuggestion.mutateAsync({
      enrichmentId: enrichment.id,
      suggestionIndex: idx,
      updates: { status: 'dismissed' },
    });
  };

  const handleCreateSubtask = (idx: number, suggestion: string) => {
    createSubtask.mutate(
      {
        suggestion,
        parentTitle: enrichment.item_title,
        parentItemId: enrichment.item_id,
        parentItemType: enrichment.item_type as 'task' | 'idea' | 'reminder' | 'asset',
      },
      {
        onSuccess: () => {
          setCreatedSubtaskIdx((prev) => new Set(prev).add(idx));
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/ai-activity')} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to AI Activity
      </Button>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
          <h1 className="text-xl sm:text-2xl font-bold">{enrichment.item_title}</h1>
        </div>
        {enrichment.created_at && (
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(enrichment.created_at), { addSuffix: true })}
          </p>
        )}
      </div>

      {/* Dismissed toggle */}
      {dismissedCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
          onClick={() => setShowDismissed(!showDismissed)}
        >
          {showDismissed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showDismissed ? 'Hide' : 'Show'} {dismissedCount} dismissed
        </Button>
      )}

      {/* Suggestions */}
      <div className="space-y-3">
        {visibleSuggestions.map((s, displayIdx) => {
          // Find the real index in the original array
          const realIdx = suggestions.indexOf(s);
          const isExecuting = executingIdx === realIdx;
          const subtaskCreated = createdSubtaskIdx.has(realIdx);

          return (
            <Card key={realIdx} className={s.status === 'dismissed' ? 'opacity-50' : ''}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{s.suggestion}</p>
                  </div>
                  {s.status === 'executed' && (
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  )}
                </div>

                {/* Action buttons for pending */}
                {s.status === 'pending' && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={isExecuting}
                      onClick={() => handleExecute(realIdx, s.suggestion)}
                    >
                      {isExecuting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                      Execute
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={subtaskCreated}
                      onClick={() => handleCreateSubtask(realIdx, s.suggestion)}
                    >
                      {subtaskCreated ? <Check className="h-3.5 w-3.5" /> : <ListPlus className="h-3.5 w-3.5" />}
                      {subtaskCreated ? 'Created' : 'Create Task'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-muted-foreground"
                      onClick={() => handleDismiss(realIdx)}
                    >
                      <X className="h-3.5 w-3.5" />
                      Dismiss
                    </Button>
                  </div>
                )}

                {/* Executed result - collapsible */}
                {s.status === 'executed' && s.result && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground px-2 h-7">
                        <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                        View result
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="bg-muted/50 rounded-md p-3 space-y-2">
                        <div className="flex items-center justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              navigator.clipboard.writeText(s.result!);
                              toast({ title: 'Copied to clipboard' });
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div
                          className="text-sm text-foreground leading-relaxed prose-sm"
                          dangerouslySetInnerHTML={{ __html: renderResultMarkdown(s.result) }}
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
