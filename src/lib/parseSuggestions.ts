export interface ParsedSuggestion {
  suggestion: string;
  result?: string | null;
  dismissed?: boolean;
}

export function parseSuggestions(raw: string | null): ParsedSuggestion[] {
  if (!raw || !raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].suggestion) {
      return parsed;
    }
  } catch {
    // Not JSON, treat as plain text
  }

  // Plain text fallback: split by numbered lines
  const lines = raw.split(/\n/).filter((l) => l.trim());
  const suggestions: ParsedSuggestion[] = [];
  for (const line of lines) {
    const match = line.match(/^\d+\.\s*(.+)/);
    if (match) {
      suggestions.push({ suggestion: match[1].trim() });
    }
  }

  return suggestions.length > 0 ? suggestions : [{ suggestion: raw.trim() }];
}
