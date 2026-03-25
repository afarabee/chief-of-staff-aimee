const FILLER_PATTERNS = [
  /^okay[,.]?\s*/i,
  /^sure[,.]?\s*/i,
  /^alright[,.]?\s*/i,
  /^so[,.]?\s*/i,
  /^well[,.]?\s*/i,
  /^here(?:'s| is| are)\s+/i,
  /^let me\s+/i,
  /^i(?:'d| would) suggest\s+/i,
  /^i(?:'d| would) recommend\s+/i,
  /^you (?:should|could|might|can)\s+/i,
  /^this is\s+/i,
  /^that(?:'s| is)\s+/i,
  /^basically[,.]?\s*/i,
  /^an? (?:outline|overview|summary|list|breakdown) of\s+/i,
];

function toTitleCase(str: string): string {
  const minor = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'in', 'of', 'with', 'is', 'are']);
  return str
    .split(/\s+/)
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i === 0 || !minor.has(lower)) {
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }
      return lower;
    })
    .join(' ');
}

export function generateTitle(text: string, maxLength = 25): string {
  // Strip markdown
  let cleaned = text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^[-•]\s*/gm, '')
    .replace(/^\d+\.\s*/gm, '');

  // Get first non-empty line
  const firstLine = cleaned.split('\n').find((l) => l.trim().length > 0)?.trim() || '';
  if (!firstLine) return 'AI Result';

  cleaned = firstLine;

  // Remove conversational filler (apply repeatedly in case of stacking)
  for (const pattern of FILLER_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  // Second pass for chained filler
  for (const pattern of FILLER_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Remove trailing punctuation
  cleaned = cleaned.replace(/[.:,;…!?]+$/, '').trim();

  // Remove leading articles if still too long
  if (cleaned.length > maxLength) {
    cleaned = cleaned.replace(/^(?:a|an|the)\s+/i, '');
  }

  if (!cleaned) return 'AI Result';

  // Truncate at word boundary
  if (cleaned.length > maxLength) {
    const truncated = cleaned.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    cleaned = lastSpace > maxLength * 0.4 ? truncated.slice(0, lastSpace) : truncated;
  }

  return toTitleCase(cleaned.trim()) || 'AI Result';
}
