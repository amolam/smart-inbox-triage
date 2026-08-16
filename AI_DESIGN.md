# AI Architecture & Prompt Engineering Design

## System: Smart Inbox Triage Engine
**AI Provider:** Google Gemini API via `@google/genai` SDK  
**Primary Model:** `gemini-2.5-flash`  
**Fallback Models:** `gemini-3.6-flash`, `gemini-2.5-flash-lite`  
**Temperature:** `0.1` (Deterministic, high-precision classification)  
**Output Format:** Structured JSON enforcing strict OpenAPI Schema  

---

## 1. AI Objective & Operational Mandate

The primary AI objective is to serve as an **explainable decision-support engine** for Operations Manager Riya. The model does not execute actions autonomously; instead, it synthesizes unstructured, chaotic operational messages into high-signal, prioritized action cards.

### Core Responsibilities
1. **Urgency Classification:** Classify messages into `critical`, `high`, `medium`, `low`, or `needs_review`.
2. **Category Identification:** Categorize the operational root cause (e.g. `vehicle_breakdown`, `delivery_delay`).
3. **Evidence Extraction:** Extract verbatim quotes from the original message that justify the classification.
4. **Action Recommendation:** Suggest a concrete, practical operational next step for Riya.
5. **Draft Response Formulation:** Pre-compose a professional, non-committal, editable response.
6. **Ambiguity Isolation:** Identify vague messages and specify exactly what information is missing.

### Non-Responsibilities (Strict Boundaries)
- The AI **must never** invent facts, order numbers, customer names, or vehicle locations.
- The AI **must never** promise unverified delivery ETAs or financial compensation.
- The AI **must never** send messages or trigger external API side-effects autonomously.

---

## 2. Prompt Architecture & System Instructions

The engine uses a deterministic system instruction paired with OpenAPI Schema constraints.

### System Prompt Design Summary (`SYSTEM_INSTRUCTION`)
```text
You are an expert AI Operations Triage Engine assisting Riya, an Operations Manager at a fast-paced 50-person logistics startup.
Her company coordinates pickups, deliveries, drivers, vehicles, customers, and vendors via WhatsApp and email.
Your mission is to perform strict, high-precision, explainable triage on incoming operational messages.

DECISION & TRIAGE FRAMEWORK:

1. URGENCY CLASSIFICATION:
- "critical": Immediate operational disruption or severe customer impact requiring prompt action (e.g. vehicle/truck breakdown, driver incapacitated, delivery blocked, pickup blocked, major customer contract escalation, imminent deadline, cold-chain temperature excursion, severe financial/reputational risk).
- "high": Significant operational issue requiring action soon (e.g. active delay >1hr, customer escalation asking for urgent status, port clearance issue, driver delayed by waterlogging).
- "medium": Action required, but no immediate same-day operational impact (e.g. rescheduling tomorrow's pickup, invoice query, advance routing adjustment).
- "low": Informational message or routine confirmation requiring no immediate intervention (e.g. "Order delivered successfully", "sensor check passed", "payment received", "waiting at gate").
- "needs_review": VAGUE, ambiguous, or incomplete messages where evidence is insufficient to determine operational impact, or AI confidence is low. NEVER force an ambiguous message into Low.

2. ACCURACY & ANTI-HALLUCINATION GUARDRAILS:
- NEVER invent facts not present in the original message.
- Do NOT invent ETAs, order numbers, customer names, locations, refunds, compensation, or commitments.
- The "evidence" array MUST contain direct quotes or key snippets extracted from the original message.
- For "needs_review", you MUST populate "missing_information" with specific questions or details needed.

3. DRAFT REPLIES:
- Concise, professional, actionable, editable.
- Never make promises Riya cannot verify.
- For "needs_review", draft a polite message asking for the exact missing details.
```

---

## 3. Structured Output JSON Schema

The model is constrained via `responseSchema` (using `@google/genai` `Type.OBJECT`):

```json
{
  "batch_summary": {
    "total_messages": "INTEGER",
    "critical_count": "INTEGER",
    "high_count": "INTEGER",
    "medium_count": "INTEGER",
    "low_count": "INTEGER",
    "needs_review_count": "INTEGER"
  },
  "messages": [
    {
      "id": "STRING",
      "original_message": "STRING",
      "priority": "critical | high | medium | low | needs_review",
      "category": "vehicle_breakdown | driver_issue | pickup_issue | delivery_delay | delivery_issue | vendor_issue | customer_escalation | reschedule_request | operational_exception | delivery_confirmation | routine_update | other",
      "confidence": "high | medium | low",
      "reason": "STRING",
      "evidence": ["STRING"],
      "recommended_action": "STRING",
      "missing_information": ["STRING (Optional)"],
      "requires_action": "BOOLEAN",
      "draft_reply": "STRING"
    }
  ]
}
```

---

## 4. Deep-Dive: Ambiguity Handling & Needs Review

### The Danger of Forced Classification
In traditional naive classifiers, a vague message like:
> *"Sir, there is a problem with the delivery."*

is often mistakenly categorized as `low` priority because it lacks urgent keywords like "fire" or "breakdown". In logistics, this failure can be catastrophic if the unstated "problem" is an overturned truck or rejected cargo.

### The Smart Inbox Triage Approach
1. **Ambiguity Recognition:** The model detects that the message indicates an operational problem but omits critical entities (Shipment ID, location, specific obstacle).
2. **`needs_review` Routing:** The item is assigned `priority: "needs_review"` and `confidence: "low"`.
3. **Missing Info Extraction:** The model populates:
   ```json
   "missing_information": [
     "Order or Shipment ID",
     "Exact nature of the delivery issue",
     "Driver current location"
   ]
   ```
4. **Targeted Draft Clarification:** The pre-composed draft directly asks for the missing parameters:
   > *"Hi, could you please provide the specific order/shipment number and describe what issue occurred so we can assist right away?"*

---

## 5. Model Selection & Fallback Architecture

### Model Hierarchy
```text
Primary Model: gemini-2.5-flash
├── Latency: ~350ms per chunk
├── Reasoning: Optimized for rapid structured extraction and classification
└── Cost Efficiency: High throughput

Fallback Tier 1: gemini-3.6-flash
└── Invoked on: 503 High Demand / 429 Rate Limit on Attempt 2

Fallback Tier 2: gemini-2.5-flash-lite
└── Invoked on: Capacity pressure on Attempt 3
```

### Retry & Exponential Backoff Specification
- **Maximum Attempts:** 3
- **Backoff Delay Schedule:**
  - Attempt 1: Immediate call (`gemini-2.5-flash`)
  - Attempt 2: Wait `1000ms + random(0-200ms) jitter` (`gemini-3.6-flash`)
  - Attempt 3: Wait `2000ms + random(0-200ms) jitter` (`gemini-2.5-flash-lite`)
- **Error Filtering (`isTransientGeminiError`):** Detects HTTP codes `429`, `500`, `503`, `504` and error strings containing `"high demand"`, `"spikes in demand"`, `"UNAVAILABLE"`, `"RESOURCE_EXHAUSTED"`, and `"ECONNRESET"`.
- **User-Facing Shield:** If all retries fail, returns a polite HTTP 503:
  > *"Gemini is temporarily unavailable. Please try again in a moment."*

---

## 6. Model Confidence vs. Measured Accuracy

> **Important Engineering Distinction:**  
> The `confidence` field (`high`, `medium`, `low`) returned by the AI represents the model's self-assessed certainty based on the explicitness of the message text. It is **not** an empirical measurement of model benchmark accuracy. Empirical accuracy must be evaluated using ground-truth labelled test sets (see `TESTING.md`).

---

## 7. AI Design Trade-Offs

| Decision | Benefit | Trade-off | Mitigation |
| :--- | :--- | :--- | :--- |
| **Low Temperature (0.1)** | Highly consistent, repeatable classifications; zero hallucinated facts. | Less creative draft replies. | Operators can edit draft replies freely in the UI. |
| **15-Message Chunks** | Prevents token context window timeouts and parallelizes batch processing. | Multiple API requests per 80-message batch. | Fast execution (~8-12 seconds total for 80 messages). |
| **Verbatim Evidence Requirement** | Ensures explainability and operator trust. | Requires strict string validation. | Client-side fallback extractor guarantees at least a 80-char substring if omitted. |

---

## 8. Future AI Enhancements (Not in MVP)

- [ ] **Few-Shot Dynamic RAG:** Inject historical company-specific acronyms and driver nicknames into the prompt context dynamically.
- [ ] **Multi-Lingual Audio Ingestion:** Direct transcription and triage of regional WhatsApp voice notes (Hindi, Marathi, Hinglish) using Gemini Multimodal Audio.
- [ ] **TMS Cross-Referencing:** Automatic entity verification against live TMS database tables before prompt execution.
