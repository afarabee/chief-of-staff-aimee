import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAiExecutions } from '@/hooks/useAiExecutions';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';

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

interface AiHistorySectionProps {
  itemId: string;
}

export function AiHistorySection({ itemId }: AiHistorySectionProps) {
  const { data: executions = [] } = useAiExecutions(itemId);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  if (executions.length === 0) return null;

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Clock className="h-4 w-4" />
        AI History
      </div>
      <div className="space-y-2">
        {executions.map((exec) => (
          <div key={exec.id} className="border border-border/50 rounded-md p-3 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium truncate flex-1 min-w-0">{exec.suggestion}</p>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(exec.created_at!), { addSuffix: true })}
              </span>
            </div>
            <Collapsible open={openItems.has(exec.id)} onOpenChange={() => toggle(exec.id)}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs text-muted-foreground gap-1">
                  {openItems.has(exec.id) ? <><ChevronUp className="h-3 w-3" /> Hide result</> : <><ChevronDown className="h-3 w-3" /> Show result</>}
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
                      onClick={() => {
                        navigator.clipboard.writeText(exec.result);
                        toast({ title: 'Copied to clipboard' });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div
                    className="text-sm text-foreground leading-relaxed prose-sm"
                    dangerouslySetInnerHTML={{ __html: renderResultMarkdown(exec.result) }}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ))}
      </div>
    </div>
  );
}
