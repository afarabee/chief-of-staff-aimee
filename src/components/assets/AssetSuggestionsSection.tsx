import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarDays, CalendarPlus, Check, Eye, EyeOff, ExternalLink, Loader2, Pencil, Plus, X } from 'lucide-react';
import { useUpdateEnrichmentSuggestion } from '@/hooks/useUpdateEnrichmentSuggestion';
import { useScheduleToCalendar } from '@/hooks/useScheduleToCalendar';
import type { AiEnrichmentRow } from '@/hooks/useAiEnrichments';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  type StructuredFrequency,
  FREQUENCY_PRESETS,
  frequencyToLabel,
  findPresetKey,
  parseStringFrequency,
} from '@/utils/frequency';

interface Props {
  enrichment: AiEnrichmentRow;
  assetName?: string;
}

export function AssetSuggestionsSection({ enrichment, assetName }: Props) {
  const updateSuggestion = useUpdateEnrichmentSuggestion();
  const scheduleToCalendar = useScheduleToCalendar();
  const [showDismissed, setShowDismissed] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ suggestion: '', recommended_due_date: '' });
  const [freqPreset, setFreqPreset] = useState('');
  const [customInterval, setCustomInterval] = useState(1);
  const [customUnit, setCustomUnit] = useState<StructuredFrequency['unit']>('months');
  const [schedulingIdx, setSchedulingIdx] = useState<number | null>(null);

  // Manual add form state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({ summary: '', start_date: '' });
  const [manualFreqPreset, setManualFreqPreset] = useState('2'); // default Monthly
  const [manualCustomInterval, setManualCustomInterval] = useState(1);
  const [manualCustomUnit, setManualCustomUnit] = useState<StructuredFrequency['unit']>('months');

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

  const handleSchedule = async (idx: number) => {
    const s = suggestions[idx];
    const freq = typeof s.frequency === 'object' && s.frequency
      ? (s.frequency as StructuredFrequency)
      : typeof s.frequency === 'string'
        ? parseStringFrequency(s.frequency) || undefined
        : undefined;

    setSchedulingIdx(idx);
    try {
      await scheduleToCalendar.mutateAsync({
        enrichmentId: enrichment.id,
        suggestionIndex: idx,
        summary: s.suggestion,
        description: `Asset: ${assetName || enrichment.item_title}`,
        startDate: s.recommended_due_date || new Date().toISOString().split('T')[0],
        frequency: freq,
      });
    } finally {
      setSchedulingIdx(null);
    }
  };

  const handleManualSchedule = async () => {
    if (!manualForm.summary || !manualForm.start_date) return;

    const freq = getManualFrequencyValue();
    setSchedulingIdx(-1); // Use -1 for manual form loading state
    try {
      await scheduleToCalendar.mutateAsync({
        enrichmentId: enrichment.id,
        suggestionIndex: -1, // Won't update any existing suggestion
        summary: manualForm.summary,
        description: `Asset: ${assetName || enrichment.item_title}`,
        startDate: manualForm.start_date,
        frequency: freq,
      });
      setShowManualForm(false);
      setManualForm({ summary: '', start_date: '' });
    } finally {
      setSchedulingIdx(null);
    }
  };

  const startEdit = (idx: number) => {
    const s = suggestions[idx];
    setEditForm({
      suggestion: s.suggestion,
      recommended_due_date: s.recommended_due_date || '',
    });
    const key = findPresetKey(s.frequency);
    setFreqPreset(key);
    if (key === 'custom') {
      const freq: StructuredFrequency =
        typeof s.frequency === 'object' && s.frequency
          ? (s.frequency as StructuredFrequency)
          : parseStringFrequency(typeof s.frequency === 'string' ? s.frequency : '') || { interval: 1, unit: 'months' };
      setCustomInterval(freq.interval);
      setCustomUnit(freq.unit);
    }
    setEditingIdx(idx);
  };

  const getFrequencyValue = (): StructuredFrequency => {
    if (freqPreset === 'custom') {
      return { interval: customInterval, unit: customUnit };
    }
    const idx = parseInt(freqPreset, 10);
    return FREQUENCY_PRESETS[idx]?.value || { interval: 1, unit: 'months' };
  };

  const getManualFrequencyValue = (): StructuredFrequency => {
    if (manualFreqPreset === 'custom') {
      return { interval: manualCustomInterval, unit: manualCustomUnit };
    }
    const idx = parseInt(manualFreqPreset, 10);
    return FREQUENCY_PRESETS[idx]?.value || { interval: 1, unit: 'months' };
  };

  const saveEdit = async () => {
    if (editingIdx === null) return;
    await updateSuggestion.mutateAsync({
      enrichmentId: enrichment.id,
      suggestionIndex: editingIdx,
      updates: {
        suggestion: editForm.suggestion,
        frequency: getFrequencyValue(),
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
        const isScheduling = schedulingIdx === realIdx;

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
                    <Select value={freqPreset} onValueChange={setFreqPreset}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_PRESETS.map((p, i) => (
                          <SelectItem key={i} value={String(i)}>{p.label}</SelectItem>
                        ))}
                        <SelectItem value="custom">Custom...</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={editForm.recommended_due_date}
                      onChange={(e) => setEditForm({ ...editForm, recommended_due_date: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                  {freqPreset === 'custom' && (
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-muted-foreground">Every</span>
                      <Input
                        type="number"
                        min={1}
                        max={99}
                        value={customInterval}
                        onChange={(e) => setCustomInterval(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                        className="w-20"
                      />
                      <Select value={customUnit} onValueChange={(v) => setCustomUnit(v as StructuredFrequency['unit'])}>
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                          <SelectItem value="years">Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
                          <Badge variant="secondary" className="text-xs">
                            {frequencyToLabel(s.frequency as StructuredFrequency | string)}
                          </Badge>
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
                    {s.status === 'scheduled' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="bg-blue-500/15 text-blue-600 border-blue-500/25">
                          <CalendarPlus className="h-3 w-3 mr-1" /> Scheduled
                        </Badge>
                        {(s as any).calendar_link && (
                          <a
                            href={(s as any).calendar_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
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

                  {s.status === 'accepted' && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => handleSchedule(realIdx)}
                        disabled={isScheduling}
                      >
                        {isScheduling ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CalendarPlus className="h-3.5 w-3.5" />
                        )}
                        {isScheduling ? 'Scheduling...' : 'Schedule'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Manual Add Maintenance Event */}
      {showManualForm ? (
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium">Add Maintenance Event</p>
            <Input
              value={manualForm.summary}
              onChange={(e) => setManualForm({ ...manualForm, summary: e.target.value })}
              placeholder="Event name (e.g., Replace furnace filter)"
            />
            <div className="flex gap-2">
              <Select value={manualFreqPreset} onValueChange={setManualFreqPreset}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_PRESETS.map((p, i) => (
                    <SelectItem key={i} value={String(i)}>{p.label}</SelectItem>
                  ))}
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={manualForm.start_date}
                onChange={(e) => setManualForm({ ...manualForm, start_date: e.target.value })}
                className="flex-1"
              />
            </div>
            {manualFreqPreset === 'custom' && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">Every</span>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={manualCustomInterval}
                  onChange={(e) => setManualCustomInterval(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                  className="w-20"
                />
                <Select value={manualCustomUnit} onValueChange={(v) => setManualCustomUnit(v as StructuredFrequency['unit'])}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleManualSchedule}
                disabled={!manualForm.summary || !manualForm.start_date || schedulingIdx === -1}
              >
                {schedulingIdx === -1 ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
                )}
                {schedulingIdx === -1 ? 'Scheduling...' : 'Schedule'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowManualForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-dashed"
          onClick={() => setShowManualForm(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Add Maintenance Event
        </Button>
      )}
    </div>
  );
}
