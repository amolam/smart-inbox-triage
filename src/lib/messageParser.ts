/**
 * Intelligently separates and normalises a raw paste of operational messages
 * (e.g. from WhatsApp, emails, spreadsheets, or bulleted/numbered logs).
 */
export interface ParsedMessagesResult {
  messages: string[];
  rawCount: number;
  duplicatesRemoved: number;
  warning?: string;
  error?: string;
}

export function parseAndNormaliseBatch(rawInput: string): ParsedMessagesResult {
  const trimmed = rawInput.trim();

  if (!trimmed) {
    return {
      messages: [],
      rawCount: 0,
      duplicatesRemoved: 0,
      error: 'Please enter at least one message to triage.',
    };
  }

  // Check character limit safeguarding (e.g., > 100,000 chars is likely unintended file dump)
  if (trimmed.length > 150000) {
    return {
      messages: [],
      rawCount: 0,
      duplicatesRemoved: 0,
      error: 'Input text is excessively large (exceeds 150KB). Please triage in batches of 50–100 messages.',
    };
  }

  // Strategy 1: Check if input has standard blank line separators (paragraphs)
  let rawChunks: string[] = [];

  // Detect if there are double newlines
  if (/\n\s*\n/.test(trimmed)) {
    rawChunks = trimmed.split(/\n\s*\n+/);
  } else {
    // Check if lines start with numbering like "1. ", "2) ", "[1]", or "- "
    const numberedLinePattern = /^(?:\d+[\.\)\-:]\s*|\[\d+\]\s*|[-•*]\s+)/m;
    const whatsappTimestampPattern = /^(?:\[\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?(?:,\s*\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})?\]|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4},\s*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\s*-\s*)/m;

    if (whatsappTimestampPattern.test(trimmed)) {
      // Split on timestamp lines
      const lines = trimmed.split('\n');
      let currentMsg = '';
      const chunks: string[] = [];

      for (const line of lines) {
        if (/^(?:\[\d{1,2}:\d{2}|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4},\s*\d{1,2}:\d{2})/.test(line.trim())) {
          if (currentMsg.trim()) {
            chunks.push(currentMsg.trim());
          }
          currentMsg = line;
        } else {
          currentMsg += (currentMsg ? '\n' : '') + line;
        }
      }
      if (currentMsg.trim()) {
        chunks.push(currentMsg.trim());
      }
      rawChunks = chunks;
    } else if (numberedLinePattern.test(trimmed)) {
      // Split on numbered/bullet items
      const lines = trimmed.split('\n');
      let currentMsg = '';
      const chunks: string[] = [];

      for (const line of lines) {
        if (/^(?:\d+[\.\)\-:]\s*|\[\d+\]\s*|[-•*]\s+)/.test(line.trim())) {
          if (currentMsg.trim()) {
            chunks.push(currentMsg.trim());
          }
          currentMsg = line.replace(/^(?:\d+[\.\)\-:]\s*|\[\d+\]\s*|[-•*]\s+)/, '');
        } else {
          currentMsg += (currentMsg ? ' ' : '') + line;
        }
      }
      if (currentMsg.trim()) {
        chunks.push(currentMsg.trim());
      }
      rawChunks = chunks;
    } else {
      // Fallback: split on individual newlines
      rawChunks = trimmed.split('\n');
    }
  }

  // Normalise each chunk: remove leading/trailing whitespace, collapse internal spaces
  const cleanedList: string[] = [];
  const seenMap = new Set<string>();
  let duplicatesRemoved = 0;

  for (const chunk of rawChunks) {
    const normalised = chunk
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    // Strip leading numbering if still present e.g. "1. " or "1) "
    const stripped = normalised.replace(/^(?:\d+[\.\)\-:]\s*|\[\d+\]\s*|[-•*]\s+)/, '').trim();

    if (stripped.length >= 3) {
      const lowerFingerprint = stripped.toLowerCase();
      if (seenMap.has(lowerFingerprint)) {
        duplicatesRemoved++;
      } else {
        seenMap.add(lowerFingerprint);
        cleanedList.push(stripped);
      }
    }
  }

  if (cleanedList.length === 0) {
    return {
      messages: [],
      rawCount: 0,
      duplicatesRemoved,
      error: 'No valid operational messages could be extracted. Please check the input text.',
    };
  }

  let warning: string | undefined;
  if (cleanedList.length > 120) {
    warning = `You pasted ${cleanedList.length} messages. For fastest response times and precision, batches of 50–100 messages are recommended.`;
  }

  return {
    messages: cleanedList,
    rawCount: rawChunks.length,
    duplicatesRemoved,
    warning,
  };
}
