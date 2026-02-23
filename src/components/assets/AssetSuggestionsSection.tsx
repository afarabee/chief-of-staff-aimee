import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Check, CalendarDays, Eye, EyeOff, Loader2, Pencil, X } from 'lucide-react';
import { useUpdateEnrichmentSuggestion } from '@/hooks/useUpdateEnrichmentSuggestion';
import type { AiEnrichmentRow } from '@/hooks/useAiEnrichments';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface Props {
  enrichment: AiEnrichmentRow;
}

export function AssetSuggestionsSection({ enrichment }: Props) {
  const updateSuggestion = useUpdateEnrichmentSuggestion();
  const [showDismissed, setShowDismissed] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ suggestion: '', frequency: '', recommended_due_date: '' });

  const suggestions = enrichment.suggestions || [];
  const visibleSuggestions = showDismissed
    ? suggestions
    : suggestions.filter((s) => s.status !== 'dismissed');
  const dismissedCount = suggestions.filter((s) => s.status === 'dismissed').length;

  const handleAccept = async (idx: number) => {
    await updateSuggestion.mutateAsync({
      enrichmentId: enrichment.id,
      suggestionIndex: idx,
      updates: { status: 'accepted' },
    });
  };

  const handleDismiss = async (idx: number) => {
    await updateSuggestion.mutateAsync({
      enrichmentId: enrichment.id,
      suggestionIndex: idx,
      updates: { status: 'dismissed' },
    });
  };

  const startEdit = (idx: number) => {
    const s = suggestions[idx];
    setEditForm({
      suggestion: s.suggestion,
      frequency: s.frequency || '',
      recommended_due_date: s.recommended_due_date || '',
    });
    setEditingIdx(idx);
  };

  const saveEdit = async () => {
    if (editingIdx === null) return;
    await updateSuggestion.mutateAsync({
      enrichmentId: enrichment.id,
      suggestionIndex: editingIdx,
      updates: {
        suggestion: editForm.suggestion,
        frequency: editForm.frequency,
        recommended_due_date: editForm.recommended_due_date,
      },
    });
    setEditingIdx(null);
  };

  return (
    <div className="space-y-3">
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

      {visibleSuggestions.map((s) => {
        const realIdx = suggestions.indexOf(s);
        const isEditing = editingIdx === realIdx;

        return (
          <Card key={realIdx} className={s.status === 'dismissed' ? 'opacity-50' : ''}>
            <CardContent className="p-4 space-y-3">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={editForm.suggestion}
                    onChange={(e) => setEditForm({ ...editForm, suggestion: e.target.value })}
                    placeholder="Maintenance task"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={editForm.frequency}
                      onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                      placeholder="Frequency (e.g. Every 3 years)"
                      className="flex-1"
                    />
                    <Input
                      type="date"
                      value={editForm.recommended_due_date}
                      onChange={(e) => setEditForm({ ...editForm, recommended_due_date: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} disabled={updateSuggestion.isPending}>
                      {updateSuggestion.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingIdx(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-sm font-semibold">{s.suggestion}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {s.frequency && (
                          <Badge variant="secondary" className="text-xs">{s.frequency}</Badge>
                        )}
                        {s.recommended_due_date && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {format(parseISO(s.recommended_due_date), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                    {s.status === 'accepted' && (
                      <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/25 shrink-0">
                        <Check className="h-3 w-3 mr-1" /> Accepted
                      </Badge>
                    )}
                  </div>

                  {s.status === 'pending' && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => startEdit(realIdx)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleAccept(realIdx)}>
                        <Check className="h-3.5 w-3.5" /> Accept
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => handleDismiss(realIdx)}>
                        <X className="h-3.5 w-3.5" /> Dismiss
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
