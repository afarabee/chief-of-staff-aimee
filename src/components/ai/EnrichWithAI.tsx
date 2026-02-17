import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEnrichItem } from '@/hooks/useEnrichItem';
import { useState } from 'react';

interface EnrichWithAIProps {
  itemType: 'task' | 'idea' | 'reminder';
  item: Record<string, any>;
  existingSuggestions: string | null;
}

export function EnrichWithAI({ itemType, item, existingSuggestions }: EnrichWithAIProps) {
  const enrich = useEnrichItem();
  const [localSuggestions, setLocalSuggestions] = useState<string | null>(null);
  const suggestions = localSuggestions ?? existingSuggestions;

  const handleEnrich = () => {
    enrich.mutate(
      { item_type: itemType, item },
      {
        onSuccess: (data) => {
          setLocalSuggestions(data);
        },
      }
    );
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
        ) : suggestions ? (
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

      {suggestions && (
        <Card className="border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {suggestions}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
