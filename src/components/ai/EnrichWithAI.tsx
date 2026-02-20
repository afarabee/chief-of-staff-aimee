import { useState } from 'react';
import { Sparkles, RefreshCw, Loader2, Zap, ListPlus, Check, ChevronDown, ChevronUp, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useEnrichItem } from '@/hooks/useEnrichItem';
import { useExecuteSuggestion } from '@/hooks/useExecuteSuggestion';
import { useCreateSubtask } from '@/hooks/useCreateSubtask';
import { useDismissSuggestion } from '@/hooks/useDismissSuggestion';
import { parseSuggestions, ParsedSuggestion } from '@/lib/parseSuggestions';
import { toast } from '@/hooks/use-toast';

interface EnrichWithAIProps {
  itemType: 'task' | 'idea' | 'reminder';
  item: Record<string, any>;
  existingSuggestions: string | null;
  itemTitle?: string;
  categoryId?: string | null;
}

function renderResultMarkdown(text: string) {
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<strong class="text-sm">$1</strong>')
    .replace(/^## (.+)$/gm, '<strong class="text-sm">$1</strong>')
    .replace(/^# (.+)$/gm, '<strong class="text-base">$1</strong>')
    .replace(/^[-•] (.+)$/gm, '<li class="ml-4">• $1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n/g, '<br/>');
  return html;
}

export function EnrichWithAI({ itemType, item, existingSuggestions, itemTitle, categoryId }: EnrichWithAIProps) {
  const enrich = useEnrichItem();
  const executeSuggestion = useExecuteSuggestion();
  const createSubtask = useCreateSubtask();
  const dismissSuggestion = useDismissSuggestion();
  const [localSuggestionsRaw, setLocalSuggestionsRaw] = useState<string | null>(null);
  const [executingIndex, setExecutingIndex] = useState<number | null>(null);
  const [executedResults, setExecutedResults] = useState<Record<number, string>>({});
  const [createdSubtasks, setCreatedSubtasks] = useState<Set<number>>(new Set());
  const [openResults, setOpenResults] = useState<Set<number>>(new Set());
  const [dismissedIndices, setDismissedIndices] = useState<Set<number>>(new Set());

  const raw = localSuggestionsRaw ?? existingSuggestions;
  const allSuggestions = parseSuggestions(raw);
  const suggestions = allSuggestions
    .map((s, idx) => ({ ...s, originalIndex: idx }))
    .filter((s) => !s.dismissed && !dismissedIndices.has(s.originalIndex));

  // Merge stored results from parsed suggestions
  const getSuggestionResult = (idx: number, s: ParsedSuggestion): string | null => {
    return executedResults[idx] || s.result || null;
  };

  const handleEnrich = () => {
    enrich.mutate(
      { item_type: itemType, item },
      {
        onSuccess: (data) => {
          setLocalSuggestionsRaw(data);
          setExecutedResults({});
          setCreatedSubtasks(new Set());
          setOpenResults(new Set());
          setDismissedIndices(new Set());
        },
      }
    );
  };

  const handleExecute = (idx: number, suggestion: string) => {
    setExecutingIndex(idx);
    const title = itemTitle || item.title || item.name || 'Untitled';
    const description = item.description || item.notes || '';
    executeSuggestion.mutate(
      {
        suggestion,
        item_type: itemType,
        item_title: title,
        item_description: description,
        item_id: item.id,
        suggestion_index: idx,
      },
      {
        onSuccess: (result) => {
          setExecutedResults((prev) => ({ ...prev, [idx]: result }));
          setOpenResults((prev) => new Set(prev).add(idx));
          setExecutingIndex(null);
        },
        onSettled: () => {
          setExecutingIndex(null);
        },
      }
    );
  };


  const handleCreateSubtask = (idx: number, suggestion: string) => {
    const title = itemTitle || item.title || item.name || 'Untitled';
    createSubtask.mutate(
      { suggestion, parentTitle: title, categoryId },
      {
        onSuccess: () => {
          setCreatedSubtasks((prev) => new Set(prev).add(idx));
        },
      }
    );
  };

  const handleCopyResult = (result: string) => {
    navigator.clipboard.writeText(result);
    toast({ title: 'Copied to clipboard' });
  };

  const toggleResult = (idx: number) => {
    setOpenResults((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleEnrich}
        disabled={enrich.isPending}
        className="gap-2"
      >
        {enrich.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enriching...
          </>
        ) : suggestions.length > 0 ? (
          <>
            <RefreshCw className="h-4 w-4" />
            Re-enrich with AI
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Enrich with AI
          </>
        )}
      </Button>

      {suggestions.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-2">
            <TooltipProvider>
              {suggestions.map((s) => {
                const idx = s.originalIndex;
                const result = getSuggestionResult(idx, s);
                const isExecuting = executingIndex === idx;
                const isExecuted = !!result;
                const isSubtaskCreated = createdSubtasks.has(idx);
                const isResultOpen = openResults.has(idx);

                return (
                  <div key={idx} className="relative border border-border/50 rounded-md p-3 space-y-2 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 min-w-0">
                      <p className="text-sm text-foreground flex-1 leading-relaxed break-words min-w-0">
                        {s.suggestion}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleExecute(idx, s.suggestion)}
                              disabled={isExecuting || isExecuted}
                            >
                              {isExecuting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : isExecuted ? (
                                <Check className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <Zap className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Execute this suggestion</TooltipContent>
                        </Tooltip>


                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleCreateSubtask(idx, s.suggestion)}
                              disabled={isSubtaskCreated}
                            >
                              {isSubtaskCreated ? (
                                <Check className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <ListPlus className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Create as subtask</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setDismissedIndices((prev) => new Set(prev).add(idx));
                                dismissSuggestion.mutate({ itemType, itemId: item.id, suggestionIndex: idx });
                              }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Dismiss suggestion</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {isExecuted && (
                      <Collapsible open={isResultOpen} onOpenChange={() => toggleResult(idx)}>
                        <CollapsibleTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto py-1 px-2 text-xs text-muted-foreground gap-1"
                          >
                            {isResultOpen ? (
                              <>
                                <ChevronUp className="h-3 w-3" />
                                Hide result
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" />
                                Show result
                              </>
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 bg-muted/50 rounded-md p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-muted-foreground">Result</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopyResult(result!)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <div
                              className="text-sm text-foreground leading-relaxed prose-sm"
                              dangerouslySetInnerHTML={{ __html: renderResultMarkdown(result!) }}
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                );
              })}
            </TooltipProvider>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
