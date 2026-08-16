# Testing Strategy & Quality Assurance Matrix

## System: Smart Inbox Triage
**Target User:** Operations Manager Riya  
**Scope:** Frontend UI, Serverless API, AI Triage Engine, Resilience & IndexedDB Persistence  

---

## 1. Testing Strategy Overview

The testing strategy validates the end-to-end reliability of the decision-support pipeline across four core pillars:
1. **Functional Correctness:** Accurate parsing, 5-tier classification, and evidence extraction.
2. **AI Resilience:** Graceful recovery during upstream Gemini 503/429 spikes.
3. **Edge Case Safety:** Handling of ambiguous, empty, or malformed inputs.
4. **Data Integrity & Security:** Server-side API key protection and local IndexedDB isolation.

---

## 2. Functional Test Cases Matrix

| ID | Scenario | Input Description | Expected Result | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | **Critical Vehicle Breakdown** | *"Driver Ramesh: Axle broke near Panvel bypass. Road blocked. Need towing crane."* | `priority: "critical"`, `category: "vehicle_breakdown"`, `confidence: "high"`, evidence contains *"Axle broke"*, draft reply acknowledges crane dispatch. | **P0** | **Verified** |
| **TC-02** | **Cold-Chain Temperature Alert** | *"Vendor QuickCold: Reefer DL-1L-8821 hit 14°C (threshold 4°C). Ice cream at risk."* | `priority: "critical"`, `category: "operational_exception"`, recommended action highlights immediate driver/reefer alert. | **P0** | **Verified** |
| **TC-03** | **Waterlogged Engine Stalled** | *"Driver Suresh: Heavy waterlogging at Kurla. Engine stalled. Water coming in cabin."* | `priority: "critical"`, `category: "driver_issue"`, high confidence, emergency action suggested. | **P0** | **Verified** |
| **TC-04** | **High-Priority Customer Escalation** | *"Customer RetailMart: Cold-storage PO-9941 was promised by 8:30 AM. Cartons will spoil in 45 mins."* | `priority: "high"`, `category: "customer_escalation"`, action recommends urgent dispatch verification. | **P0** | **Verified** |
| **TC-05** | **Checkpost Missing E-Way Bill** | *"Driver Satish: Police stopped truck at Vashi checkpost. E-way bill missing from folder."* | `priority: "high"`, `category: "driver_issue"`, action suggests sending digital copy immediately. | **P0** | **Verified** |
| **TC-06** | **Medium Next-Day Reschedule** | *"Customer PharmaCare: Need to reschedule PO-4481 from 2 PM today to tomorrow 10 AM."* | `priority: "medium"`, `category: "reschedule_request"`, non-emergency routing adjustment. | **P1** | **Verified** |
| **TC-07** | **Routine POD Confirmation** | *"Driver Vinod: Delivery completed at Flipkart Hub. Docket #99482 signed."* | `priority: "low"`, `category: "delivery_confirmation"`, `requires_action: false`. | **P1** | **Verified** |
| **TC-08** | **Ambiguous 3-Word Ping** | *"Driver Vikas: Sir problem with delivery."* | `priority: "needs_review"`, `confidence: "low"`, `missing_information` contains Order ID & location. | **P0** | **Verified** |
| **TC-09** | **Full 80-Message Morning Rush** | 80 mixed operational logs from `sampleBatches.ts`. | Successfully parsed into 80 cards; metrics correctly sum all priorities; execution completes without timeout. | **P0** | **Verified** |
| **TC-10** | **Empty Input Validation** | Empty textarea submitted. | Client validation prevents API call and shows alert toast. | **P0** | **Verified** |
| **TC-11** | **WhatsApp Header Parsing** | Text containing `[09:12 AM] Driver Name: ...` format. | Successfully split into distinct message records with timestamps preserved. | **P0** | **Verified** |
| **TC-12** | **Batch >150 Items Limit** | Array of 151 messages sent to `/api/triage`. | Backend returns HTTP 400 Bad Request with explicit size error message. | **P1** | **Verified** |

---

## 3. AI Fault Tolerance & Resilience Test Cases

| ID | Failure Mode Simulated | Test Condition | Expected Behavior | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TR-01** | **HTTP 503 Service Unavailable** | Primary model returns 503 high demand error. | Engine catches 503, pauses ~1s, and successfully completes triage using fallback model `gemini-3.6-flash`. | **Verified** |
| **TR-02** | **HTTP 429 Rate Limit** | Primary model throws resource exhausted. | Engine applies exponential backoff with jitter and retries on fallback tier. | **Verified** |
| **TR-03** | **All 3 Model Attempts Fail** | Upstream network completely down. | Returns clean HTTP 503 *"Gemini is temporarily unavailable. Please try again in a moment."* | **Verified** |
| **TR-04** | **Missing Schema Properties** | AI response omits `recommended_action` or `evidence`. | `sanitizeMessageResult` applies safe logistics defaults without throwing runtime exceptions. | **Verified** |

---

## 4. Empirical Accuracy Evaluation Framework (Proposed for Pilot)

To measure classification quality during real-world customer pilot runs, the following evaluation metrics should be tracked against a ground-truth human-annotated dataset of 500+ messages:

```text
1. Critical Recall Rate:
   [True Criticals Detected] / [Total Ground-Truth Criticals]
   Target: >= 99.0% (Zero tolerance for missed breakdowns)

2. Critical False-Negative Rate:
   [Criticals misclassified as Medium/Low] / [Total Criticals]
   Target: <= 1.0%

3. Needs-Review Precision:
   [Accurately Flagged Ambiguous Messages] / [Total Flagged as Needs Review]
   Target: >= 92.0%

4. Draft Reply Usability:
   [% of Drafts copied with <= 20% edits by Operator]
   Target: >= 80.0%
```

*(Note: These metrics define the QA evaluation framework for pilot deployment; they are not synthetic claims.)*

---

## 5. Security & Persistence Verification

| Test Scenario | Verification Method | Result |
| :--- | :--- | :--- |
| **No Client-Side API Keys** | Inspect client bundle (`dist/assets/*.js`) for `GEMINI_API_KEY` or `AIzaSy`. | **PASSED** (0 secrets found in client bundle) |
| **Server-Side Key Isolation** | Verify `/api/health` reports status without returning the raw key string. | **PASSED** (Returns `hasApiKey: true` boolean only) |
| **IndexedDB Persistence** | Triage 80 messages, reload browser page (`F5`), verify batch is restored. | **PASSED** (Batch restored instantly from IndexedDB) |
| **CSV / JSON Export** | Export batch from Batch History Modal and inspect output format. | **PASSED** (Valid formatted CSV/JSON generated) |
| **Build & Type Checking** | Run `npm run lint` (`tsc --noEmit`) and `npm run build`. | **PASSED** (0 TypeScript or bundle errors) |
