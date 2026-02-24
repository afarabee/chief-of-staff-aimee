export interface StructuredFrequency {
  interval: number;
  unit: 'days' | 'weeks' | 'months' | 'years';
}

export const FREQUENCY_PRESETS: { label: string; value: StructuredFrequency }[] = [
  { label: 'Weekly', value: { interval: 1, unit: 'weeks' } },
  { label: 'Every 2 weeks', value: { interval: 2, unit: 'weeks' } },
  { label: 'Monthly', value: { interval: 1, unit: 'months' } },
  { label: 'Every 2 months', value: { interval: 2, unit: 'months' } },
  { label: 'Every 3 months', value: { interval: 3, unit: 'months' } },
  { label: 'Every 6 months', value: { interval: 6, unit: 'months' } },
  { label: 'Annually', value: { interval: 1, unit: 'years' } },
  { label: 'Every 2 years', value: { interval: 2, unit: 'years' } },
  { label: 'Every 3 years', value: { interval: 3, unit: 'years' } },
  { label: 'Every 5 years', value: { interval: 5, unit: 'years' } },
];

export function frequencyToLabel(freq: StructuredFrequency | string | undefined | null): string {
  if (!freq) return '';
  if (typeof freq === 'string') return freq;

  const preset = FREQUENCY_PRESETS.find(
    (p) => p.value.interval === freq.interval && p.value.unit === freq.unit
  );
  if (preset) return preset.label;

  const unitSingular: Record<string, string> = { days: 'day', weeks: 'week', months: 'month', years: 'year' };
  if (freq.interval === 1) {
    const map: Record<string, string> = { days: 'Daily', weeks: 'Weekly', months: 'Monthly', years: 'Annually' };
    return map[freq.unit] || `Every ${freq.unit}`;
  }
  return `Every ${freq.interval} ${freq.unit}`;
}

export function findPresetKey(freq: StructuredFrequency | string | undefined | null): string {
  if (!freq) return '';
  if (typeof freq === 'string') {
    const parsed = parseStringFrequency(freq);
    if (parsed) return findPresetKey(parsed);
    return 'custom';
  }
  const idx = FREQUENCY_PRESETS.findIndex(
    (p) => p.value.interval === freq.interval && p.value.unit === freq.unit
  );
  return idx >= 0 ? String(idx) : 'custom';
}

export function parseStringFrequency(s: string): StructuredFrequency | null {
  const lower = s.toLowerCase().trim();
  if (lower === 'daily') return { interval: 1, unit: 'days' };
  if (lower === 'weekly') return { interval: 1, unit: 'weeks' };
  if (lower === 'monthly') return { interval: 1, unit: 'months' };
  if (lower === 'annually' || lower === 'yearly') return { interval: 1, unit: 'years' };

  const match = lower.match(/every\s+(\d+)\s*(days?|weeks?|months?|years?)/);
  if (match) {
    const interval = parseInt(match[1], 10);
    let unit = match[2].replace(/s$/, '') as string;
    const unitMap: Record<string, StructuredFrequency['unit']> = { day: 'days', week: 'weeks', month: 'months', year: 'years' };
    return { interval, unit: unitMap[unit] || 'months' };
  }
  return null;
}

/** Convert structured frequency to Google Calendar RRULE string */
export function frequencyToRRule(freq: StructuredFrequency): string {
  const unitMap: Record<string, string> = {
    days: 'DAILY',
    weeks: 'WEEKLY',
    months: 'MONTHLY',
    years: 'YEARLY',
  };
  const rruleFreq = unitMap[freq.unit] || 'MONTHLY';
  if (freq.interval === 1) {
    return `RRULE:FREQ=${rruleFreq}`;
  }
  return `RRULE:FREQ=${rruleFreq};INTERVAL=${freq.interval}`;
}
