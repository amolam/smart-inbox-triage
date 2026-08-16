import { GoogleGenAI, Type } from '@google/genai';

// Lazy initialize GoogleGenAI client
let aiClient: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface MessageTriageItem {
  id: string;
  original_message: string;
  priority: 'critical' | 'high' | 'medium' | 'low' | 'needs_review';
  category: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  evidence: string[];
  recommended_action: string;
  missing_information?: string[];
  requires_action: boolean;
  draft_reply: string;
}

export interface BatchTriageResponse {
  batch_summary: {
    total_messages: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    needs_review_count: number;
  };
  messages: MessageTriageItem[];
}

export const SYSTEM_INSTRUCTION = `You are an expert AI Operations Triage Engine assisting Riya, an Operations Manager at a fast-paced 50-person logistics startup.
Her company coordinates pickups, deliveries, drivers, vehicles, customers, and vendors via WhatsApp and email.
Your mission is to perform strict, high-precision, explainable triage on incoming operational messages.

You must follow this explicit DECISION & TRIAGE FRAMEWORK:

1. URGENCY CLASSIFICATION (Exactly one of):
- "critical": Immediate operational disruption or severe customer impact requiring prompt action (e.g. vehicle/truck breakdown, driver incapacitated/unable to proceed, delivery blocked, pickup blocked, major customer contract escalation/cancellation threat, imminent same-day deadline, cold-chain temperature excursion, severe financial/reputational risk).
- "high": Significant operational issue requiring action soon (e.g. active delay >1hr, customer escalation asking for urgent status, port clearance issue, driver delayed by waterlogging).
- "medium": Action required, but no immediate same-day operational impact (e.g. rescheduling tomorrow's pickup, invoice query, advance routing adjustment).
- "low": Informational message or routine confirmation requiring no immediate intervention (e.g. "Order delivered successfully", "sensor check passed", "payment received", "waiting at gate").
- "needs_review": VAGUE, ambiguous, or incomplete messages where evidence is insufficient to determine operational impact, or AI confidence is low (e.g. "Sir, there is a problem with the delivery.", "Truck issue. Please check.", "Customer is angry"). NEVER force an ambiguous message into Low. When in doubt on potentially serious issues, prefer "needs_review" over Low.

2. ACCURACY & ANTI-HALLUCINATION GUARDRAILS:
- NEVER invent facts not present in the original message.
- Do NOT invent ETAs, order numbers, customer names, locations, refunds, compensation, or commitments.
- The "evidence" array MUST contain direct quotes or key snippets extracted from the original message.
- For "needs_review", you MUST populate "missing_information" with specific questions or details needed (e.g., "Nature of vehicle issue", "Order/Shipment ID", "Which delivery is affected").

3. DRAFT REPLIES:
- Concise, professional, actionable, editable.
- Never make promises Riya cannot verify.
- For "needs_review", draft a polite message asking for the exact missing details.
- For "critical" or "high", draft an acknowledgement stating the operations team is investigating/coordinating immediately.

4. CATEGORIES (Exactly one):
- "vehicle_breakdown", "driver_issue", "pickup_issue", "delivery_delay", "delivery_issue", "vendor_issue", "customer_escalation", "reschedule_request", "operational_exception", "delivery_confirmation", "routine_update", "other"

5. CONFIDENCE:
- "high", "medium", "low" (Reflects certainty based on message clarity).

Always return clean, valid structured JSON adhering to the specified schema.`;

export const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    batch_summary: {
      type: Type.OBJECT,
      properties: {
        total_messages: { type: Type.INTEGER },
        critical_count: { type: Type.INTEGER },
        high_count: { type: Type.INTEGER },
        medium_count: { type: Type.INTEGER },
        low_count: { type: Type.INTEGER },
        needs_review_count: { type: Type.INTEGER },
      },
      required: [
        'total_messages',
        'critical_count',
        'high_count',
        'medium_count',
        'low_count',
        'needs_review_count',
      ],
    },
    messages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Unique ID for the message item' },
          original_message: { type: Type.STRING },
          priority: {
            type: Type.STRING,
            description: 'critical, high, medium, low, or needs_review',
          },
          category: {
            type: Type.STRING,
            description:
              'vehicle_breakdown, driver_issue, pickup_issue, delivery_delay, delivery_issue, vendor_issue, customer_escalation, reschedule_request, operational_exception, delivery_confirmation, routine_update, or other',
          },
          confidence: { type: Type.STRING, description: 'high, medium, or low' },
          reason: { type: Type.STRING, description: 'Clear explanation for the priority' },
          evidence: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Verbatim quotes or key phrases extracted from source message',
          },
          recommended_action: {
            type: Type.STRING,
            description: 'Actionable next step for Operations Manager Riya',
          },
          missing_information: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Specific missing details if message is vague or needs review',
          },
          requires_action: { type: Type.BOOLEAN },
          draft_reply: {
            type: Type.STRING,
            description: 'Concise, professional suggested response for Riya to review and send',
          },
        },
        required: [
          'id',
          'original_message',
          'priority',
          'category',
          'confidence',
          'reason',
          'evidence',
          'recommended_action',
          'requires_action',
          'draft_reply',
        ],
      },
    },
  },
  required: ['batch_summary', 'messages'],
};

// Helper to validate and clean priority & category values
export function sanitizeMessageResult(
  item: any,
  fallbackOriginal: string,
  index: number
): MessageTriageItem {
  const allowedPriorities = ['critical', 'high', 'medium', 'low', 'needs_review'];
  const allowedConfidences = ['high', 'medium', 'low'];
  const allowedCategories = [
    'vehicle_breakdown',
    'driver_issue',
    'pickup_issue',
    'delivery_delay',
    'delivery_issue',
    'vendor_issue',
    'customer_escalation',
    'reschedule_request',
    'operational_exception',
    'delivery_confirmation',
    'routine_update',
    'other',
  ];

  let priority = typeof item?.priority === 'string' ? item.priority.toLowerCase().trim() : 'needs_review';
  if (!allowedPriorities.includes(priority)) {
    priority = 'needs_review';
  }

  let confidence = typeof item?.confidence === 'string' ? item.confidence.toLowerCase().trim() : 'medium';
  if (!allowedConfidences.includes(confidence)) {
    confidence = 'medium';
  }

  let category = typeof item?.category === 'string' ? item.category.toLowerCase().trim() : 'other';
  if (!allowedCategories.includes(category)) {
    category = 'other';
  }

  const originalMessage = item?.original_message || fallbackOriginal;
  const reason = item?.reason || 'Evaluated based on operational disruption, urgency, and customer impact.';
  const evidence = Array.isArray(item?.evidence) && item.evidence.length > 0 ? item.evidence : [originalMessage.slice(0, 80)];
  const recommended_action =
    item?.recommended_action ||
    (priority === 'critical' || priority === 'high'
      ? 'Investigate operational blocker immediately and contact relevant driver/vendor.'
      : 'Review and acknowledge message.');
  const requires_action =
    typeof item?.requires_action === 'boolean'
      ? item.requires_action
      : priority === 'critical' || priority === 'high' || priority === 'medium' || priority === 'needs_review';

  let missing_information: string[] = [];
  if (Array.isArray(item?.missing_information)) {
    missing_information = item.missing_information.filter((s: any) => typeof s === 'string' && s.trim().length > 0);
  } else if (priority === 'needs_review') {
    missing_information = ['Specific order/shipment reference', 'Exact nature of the issue and location'];
  }

  let draft_reply = item?.draft_reply || '';
  if (!draft_reply) {
    if (priority === 'needs_review') {
      draft_reply = 'Could you please provide the specific order/shipment details and describe what issue occurred so we can assist right away?';
    } else if (priority === 'critical' || priority === 'high') {
      draft_reply = 'Received and acknowledged. Our operations team is escalating this immediately. We will share an update shortly.';
    } else {
      draft_reply = 'Received and noted. Thank you.';
    }
  }

  return {
    id: item?.id || `msg-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    original_message: originalMessage,
    priority: priority as any,
    category,
    confidence: confidence as any,
    reason,
    evidence,
    recommended_action,
    missing_information,
    requires_action,
    draft_reply,
  };
}

// Supported, reliable production Gemini Flash models
export const PRIMARY_FLASH_MODEL = 'gemini-2.5-flash';
export const FALLBACK_FLASH_MODELS = ['gemini-3.6-flash', 'gemini-2.5-flash-lite'];

// Helper to determine if an error is transient (e.g., 503 high demand, 429 rate limit, 500, 504)
export function isTransientGeminiError(error: any): boolean {
  if (!error) return false;
  const status = error?.status || error?.statusCode || error?.response?.status;
  if ([429, 500, 503, 504].includes(Number(status))) {
    return true;
  }
  const msg = String(error?.message || error || '').toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('spikes in demand') ||
    msg.includes('overloaded') ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('500') ||
    msg.includes('504') ||
    msg.includes('deadline_exceeded') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('fetch failed') ||
    msg.includes('network error')
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to call Gemini for a chunk of messages with exponential backoff & model fallbacks
export async function processMessageChunkWithGemini(
  messagesChunk: { id: string; text: string }[]
): Promise<MessageTriageItem[]> {
  const ai = getAiClient();

  const userPrompt = `Please triage the following ${messagesChunk.length} operational messages. Return the structured JSON according to the schema.

MESSAGES TO TRIAGE:
${messagesChunk.map((m) => `[Message ID: ${m.id}]\n${m.text}`).join('\n\n---' + '\n\n')}`;

  const callModelWithSpecificName = async (modelName: string) => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const responseText = response.text?.trim() || '{}';
    return JSON.parse(responseText);
  };

  // Attempt strategy:
  // Attempt 1: PRIMARY_FLASH_MODEL ('gemini-2.5-flash')
  // Attempt 2: FALLBACK_FLASH_MODELS[0] ('gemini-flash-latest') after ~1s backoff
  // Attempt 3: FALLBACK_FLASH_MODELS[1] ('gemini-3.7-flash') after ~2s backoff
  const modelsToAttempt = [
    PRIMARY_FLASH_MODEL,
    FALLBACK_FLASH_MODELS[0] || PRIMARY_FLASH_MODEL,
    FALLBACK_FLASH_MODELS[1] || PRIMARY_FLASH_MODEL,
  ];

  // Exponential backoff schedule in ms (with small jitter): ~1s, ~2s, ~4s
  const backoffDelays = [1000, 2000, 4000];

  let rawJson: any = null;
  let lastError: any = null;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const currentModel = modelsToAttempt[attempt - 1] || PRIMARY_FLASH_MODEL;
    try {
      rawJson = await callModelWithSpecificName(currentModel);
      // Success
      break;
    } catch (err: any) {
      lastError = err;
      const isTransient = isTransientGeminiError(err);
      console.warn(
        `[Gemini Triage] Attempt ${attempt}/${maxAttempts} failed using model '${currentModel}' (transient: ${isTransient}):`,
        err?.message || err
      );

      if (attempt < maxAttempts) {
        // Compute backoff with 100-300ms jitter
        const baseDelay = backoffDelays[attempt - 1] || 1000;
        const jitter = Math.floor(Math.random() * 200);
        const delayMs = baseDelay + jitter;
        await sleep(delayMs);
      }
    }
  }

  if (!rawJson) {
    console.error(`[Gemini Triage] All ${maxAttempts} attempts exhausted. Last error:`, lastError);
    if (isTransientGeminiError(lastError)) {
      const transientErr: any = new Error('Gemini is temporarily unavailable. Please try again in a moment.');
      transientErr.statusCode = 503;
      throw transientErr;
    }
    const genericErr: any = new Error('Gemini is temporarily unavailable. Please try again in a moment.');
    genericErr.statusCode = lastError?.statusCode || 500;
    throw genericErr;
  }

  // Parse and validate items
  const returnedMessages = Array.isArray(rawJson?.messages) ? rawJson.messages : [];
  const results: MessageTriageItem[] = [];

  // Match returned messages or align with original chunk
  messagesChunk.forEach((chunkItem, idx) => {
    const matched =
      returnedMessages.find((rm: any) => rm.id === chunkItem.id) ||
      returnedMessages[idx] ||
      {};

    results.push(sanitizeMessageResult(matched, chunkItem.text, idx));
  });

  return results;
}

// Main triage controller used by both Express server and Vercel serverless functions
export async function executeTriage(messages: any[]): Promise<BatchTriageResponse> {
  if (!Array.isArray(messages) || messages.length === 0) {
    const error: any = new Error('Please provide an array with at least one message string.');
    error.statusCode = 400;
    throw error;
  }

  if (messages.length > 150) {
    const error: any = new Error('Batch size too large. Maximum supported batch size is 150 messages.');
    error.statusCode = 400;
    throw error;
  }

  const formattedItems = messages.map((text: any, index: number) => ({
    id: `msg-${Date.now()}-${index + 1}`,
    text: typeof text === 'string' ? text.trim() : String(text || ''),
  }));

  const CHUNK_SIZE = 15;
  const chunks: { id: string; text: string }[][] = [];
  for (let i = 0; i < formattedItems.length; i += CHUNK_SIZE) {
    chunks.push(formattedItems.slice(i, i + CHUNK_SIZE));
  }

  const allResults: MessageTriageItem[] = [];
  for (const chunk of chunks) {
    const chunkResults = await processMessageChunkWithGemini(chunk);
    allResults.push(...chunkResults);
  }

  const summary = {
    total_messages: allResults.length,
    critical_count: allResults.filter((m) => m.priority === 'critical').length,
    high_count: allResults.filter((m) => m.priority === 'high').length,
    medium_count: allResults.filter((m) => m.priority === 'medium').length,
    low_count: allResults.filter((m) => m.priority === 'low').length,
    needs_review_count: allResults.filter((m) => m.priority === 'needs_review').length,
  };

  return {
    batch_summary: summary,
    messages: allResults,
  };
}
