# Product Requirements Document (PRD)

## Project Name: Smart Inbox Triage
**Author:** Forward Deployed Engineering Team  
**Status:** MVP Implemented & Verified  
**Target User:** Riya — Operations Manager at a 50-Person Logistics Startup  
**Version:** 1.0.0  

---

## 1. Problem Statement

At a 50-person logistics startup coordinating hundreds of daily shipments, operational communication is fragmented across WhatsApp groups and email threads. By 10:00 AM each morning, Operations Manager **Riya** receives **80+ unread operational messages** from drivers, dispatchers, customers, and fleet vendors.

Her incoming inbox is an unranked stream containing a hazardous mix of:
- **Severe operational crises:** Vehicle axle breakdowns, cold-chain temperature breaches, road blockages, police detentions.
- **Customer escalations:** Threat of SLA penalties, missed delivery windows, missing PODs.
- **Routine status logs:** Successful deliveries, toll receipts, fuel price updates.
- **Ambiguous pings:** Vague 3-word driver texts like *"Sir problem with delivery"*.

Currently, Riya spends **60 to 90 minutes every morning** manually reading and categorizing each message. Because urgent escalations are visually indistinguishable from routine confirmations, critical vehicle breakdowns often sit unnoticed for over an hour, leading to missed delivery windows, client penalties, and operational chaos.

---

## 2. User Persona & Job-to-be-Done

### Persona Profile: Riya (Operations Manager)
- **Role:** Leads daily dispatch, vehicle routing, driver coordination, and incident management.
- **Environment:** High-stress, rapid-turnaround environment where a 30-minute delay in responding to a vehicle breakdown can cost a key enterprise account.
- **Key Pain Point:** Cognitive overload from reading dozens of low-priority messages just to find the 5 critical emergencies that need immediate action.

### Job-to-be-Done (JTBD)
> *"When I open my operational inbox in the morning, I want to immediately identify which incoming messages require urgent operational intervention, understand the exact reason and supporting evidence, decide what to do next, and send verified responses in minutes without manually combing through 80+ unstructured chats."*

---

## 3. Current vs. Desired Workflow

```text
CURRENT WORKFLOW (Manual, 60-90 mins):
1. Open WhatsApp & Email.
2. Read Message #1 -> evaluate -> reply.
3. Read Message #2 -> routine update -> ignore.
4. Read Message #3 -> ambiguous ping -> ask driver for details.
...
80. Finally reach Message #78 (Critical Breakdown from 8:45 AM) -> 75 minutes late!

DESIRED WORKFLOW WITH SMART INBOX TRIAGE (Decision-Support, <3 mins):
1. Paste or import morning batch of 80 messages.
2. Click "Analyze & Triage".
3. AI surfaces 5 Critical, 8 High, and 4 Needs Review items instantly at the top.
4. Riya inspects Critical Card #1, reviews extracted evidence, edits pre-generated draft reply, and copies it to WhatsApp.
5. Riya checks "Needs Review" items, sends targeted clarification questions, and clears the queue.
```

---

## 4. Core Product Principles

1. **Speed & Cognitive Relief:** Accelerate time-to-decision from 60+ minutes to under 3 minutes.
2. **Prioritization Over Sorting:** Surface high-impact operational disruptions immediately.
3. **Explainability & Grounding:** No black-box AI; every classification must present a reason and direct quote evidence from the message.
4. **Strict Human Oversight:** AI acts purely as an advisor; the human operator makes the final call and manually dispatches all messages.
5. **Zero Hallucination Tolerance:** The system must never fabricate shipment IDs, ETAs, compensation promises, or vehicle locations.

---

## 5. MVP Functional Requirements

| Req ID | Feature / Capability | User Value | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01** | **Multi-Format Batch Input** | Allows Riya to paste raw WhatsApp chat exports, numbered lists, or newline-separated messages without manual pre-formatting. | **P0** | Accepts up to 150 messages; automatically normalizes timestamps, numbered prefixes, and blank lines via `messageParser.ts`. |
| **FR-02** | **Demo Presets** | Instant evaluation and testing of realistic operational scenarios without manual typing. | **P0** | Provides 4 one-click presets: *80-Message Morning Rush*, *Critical Breakdowns*, *Ambiguous Pings*, and *Routine Confirmations*. |
| **FR-03** | **5-Tier Urgency Classification** | Distinguishes urgent operational crises from noise and flags ambiguity. | **P0** | Every message is classified into exactly one tier: `critical`, `high`, `medium`, `low`, or `needs_review`. |
| **FR-04** | **12-Category Classification** | Organizes operational domain issues for structured filtering. | **P0** | Categorizes items into: `vehicle_breakdown`, `driver_issue`, `pickup_issue`, `delivery_delay`, `delivery_issue`, `vendor_issue`, `customer_escalation`, `reschedule_request`, `operational_exception`, `delivery_confirmation`, `routine_update`, `other`. |
| **FR-05** | **Verbatim Evidence Extraction** | Eliminates black-box AI skepticism by grounding classifications in actual message quotes. | **P0** | Outputs an array of exact text snippets quoted directly from the source message. |
| **FR-06** | **Actionable Operational Guidance** | Gives Riya a clear, practical recommendation for what to do next. | **P0** | Each card features a concise `recommended_action` tailored to logistics dispatch. |
| **FR-07** | **Editable Draft Replies** | Speeds up response time by generating professional, context-aware reply templates. | **P0** | Generates non-committal, professional drafts that Riya can edit directly in the UI and copy with one click. |
| **FR-08** | **Vague Message / Needs Review Engine** | Prevents ambiguous messages from being misclassified as low priority. | **P0** | Messages lacking key facts are flagged as `needs_review`, identifying specific `missing_information` (e.g., Order ID, vehicle number). |
| **FR-09** | **Deep Inspection Detail Drawer** | Allows focused review of individual incidents without losing list context. | **P0** | Side drawer displaying full original text, reason, evidence chips, draft editor, custom notes input, and keyboard navigation (`←`/`→`/`Esc`). |
| **FR-10** | **Filtering, Sorting & Text Search** | Enables Riya to slice the inbox by priority, category, confidence, status, or search query. | **P0** | Instant client-side filtering by any combination of Priority, Category, Status (`pending`, `reviewed`, `actioned`, `dismissed`), and keyword search. |
| **FR-11** | **Local IndexedDB Persistence** | Saves batches, status edits, user notes, and audit logs locally across browser reloads. | **P0** | Stores batches in browser IndexedDB (`smart_inbox_triage_db`); supports CSV and JSON export; zero external DB required. |
| **FR-12** | **Batch History Manager** | Allows Riya to reopen previous morning batches, track resolution history, and delete stale batches. | **P1** | Modal interface listing all historical batches with total message counts, summary breakdowns, and timestamps. |

---

## 6. Non-Functional Requirements

- **API Security:** `GEMINI_API_KEY` is strictly contained on the server-side in Vercel Serverless Functions / Express middleware and never exposed to the client.
- **Latency & Chunking:** Batch processing splits requests into 15-message chunks to optimize AI token throughput and latency, completing 80 messages in under 15 seconds.
- **AI Fault Tolerance:** Exponential backoff (~1s, ~2s, ~4s) with automated model fallback (`gemini-2.5-flash` → `gemini-3.6-flash` → `gemini-2.5-flash-lite`) to survive upstream Google API capacity spikes.
- **Data Privacy:** Zero server-side persistence of operational message data. All triaged batches and operator notes reside entirely within the user's local browser IndexedDB.
- **Responsive Ergonomics:** Fluid desktop and tablet layouts with accessibility focus states, dark/light contrast ratios exceeding WCAG AA standards, and keyboard shortcuts.

---

## 7. Edge Cases Handled

| Scenario | System Behavior |
| :--- | :--- |
| **Empty or Whitespace Input** | Validation triggers immediately in `InputSection.tsx`, blocking API calls and displaying an inline warning. |
| **Malformed / Single Unbroken String** | `messageParser.ts` applies regex splitting on numbered items, bullet points, or WhatsApp timestamp headers to extract individual entries. |
| **Ambiguous 3-Word Message** (e.g., *"Sir problem"*) | Engine classifies item as `needs_review`, sets confidence to `low`, extracts missing details (Order ID, location, issue type), and drafts a clarification request. |
| **Upstream Gemini API 503 / 429 Spike** | Engine automatically retries up to 3 times with exponential backoff and switches to backup Flash models before throwing a clean 503 user error. |
| **AI Output Formatting Error** | Fallback sanitization in `sanitizeMessageResult` ensures every returned item has valid priority, confidence, reason, and draft reply even if the AI drops a field. |
| **Batch Exceeds Maximum Limit** | Backend rejects batches >150 items with an explicit 400 Bad Request error. |

---

## 8. Out of Scope (Future / Not Implemented in MVP)

The following items are **explicitly out of scope** for the MVP:
- **Direct WhatsApp / Email Webhooks:** Automatic ingestion directly from WhatsApp Business API or Gmail IMAP.
- **Autonomous Auto-Sending:** Automatic transmission of messages without human operator review.
- **Multi-Tenant User Accounts & Auth:** Centralized login, SSO, and user management.
- **Cloud Database Synchronization:** Remote shared databases (e.g. Supabase, PostgreSQL, Firebase) for cross-device synchronization.
- **Live GPS Fleet Map Tracking:** In-app map rendering of vehicle telemetry.

---

## 9. Success Metrics

### Proposed Metrics (Target for Production Rollout)
- **Triage Duration:** Reduce morning triage time from ~60 minutes to <3 minutes.
- **Critical Detection Speed:** Time-to-identification of vehicle breakdowns < 15 seconds from batch upload.
- **Operator Edit Rate:** Operator accepts or lightly edits pre-generated draft replies in >80% of cases.
- **Needs Review Precision:** >90% of ambiguous messages correctly routed to `needs_review` rather than falsely assigned to `low`.

*(Note: Measured empirical performance metrics will be gathered during live customer pilot trials.)*
