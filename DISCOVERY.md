# Discovery Sprint Worksheet & FDE Analysis

**Client:** Riya, Operations Manager  
**Company:** Fast-Growing Logistics Startup (50 employees, ~150 active delivery vehicles)  
**Engagement Type:** Forward Deployed Engineering (FDE) Discovery & Solution Design  

---

## 1. Problem & Persona Context

### Who is the user?
**Riya**, the frontline Operations Manager responsible for real-time fleet coordination, driver dispatch, route adherence, and customer incident resolution.

### What is her Job-to-be-Done?
> *"Quickly identify which incoming operational messages require immediate attention, understand why, decide what to do next, and respond faster without manually reading and analysing every message."*

### Current Operational Workflow
1. At 9:00 AM, Riya opens 12 different WhatsApp driver groups, 4 vendor chats, and her dispatch inbox.
2. By 10:00 AM, over 80 unstructured messages have accumulated.
3. Riya reads each message sequentially in chronological order.
4. She manually searches her Transport Management System (TMS) or calls drivers to clarify vague messages.
5. She drafts and sends individual responses while maintaining a mental queue of unresolved issues.

### Why is this broken?
- **Sequential Inefficiency:** Reading 80+ messages sequentially takes 60–90 minutes.
- **Critical Signal Buried in Noise:** An axle failure reported at 9:12 AM sits at the bottom of the chat queue while Riya reads 20 routine *"Order delivered"* messages from 9:40 AM.
- **Ambiguity Friction:** Drivers send unhelpful 3-word texts (*"Sir problem with delivery"*), forcing Riya to waste time drafting clarification requests.
- **Cognitive Exhaustion:** High mental overhead from context-switching between vehicle mechanics, customer SLAs, toll plaza payments, and route detours.

---

## 2. Constraints Evaluation

| Constraint Category | Real-World & MVP Reality | FDE Design Decision |
| :--- | :--- | :--- |
| **Time-to-Value** | Riya needs immediate morning assistance; cannot wait months for enterprise API integrations. | Build a lightweight, high-performance batch triage interface that accepts copy-pasted WhatsApp chats and logs instantly. |
| **Human Accountability** | In logistics, sending an incorrect automated promise (e.g. promising a refund or unrealistic ETA) creates legal and financial liability. | **Strict Human-in-the-Loop:** AI acts purely as an analyst and drafting assistant. Riya makes the final decision and sends messages manually. |
| **Hallucination Risk** | Operations cannot tolerate invented order numbers, fake ETAs, or imagined locations. | Enforce structured JSON output with verbatim quote evidence extraction and strict prompt guardrails against assumption. |
| **Infrastructure Overhead** | Setting up complex multi-user databases or cloud infrastructure delays deployment and introduces security compliance friction. | Use a serverless Vercel function with client-side IndexedDB persistence for instantaneous, private local storage. |
| **AI Availability Spikes** | Foundation model APIs occasionally experience transient high-demand spikes (503/429). | Build an automated 3-tier exponential backoff retry pipeline with multi-model fallback (`gemini-2.5-flash` → `gemini-3.6-flash` → `gemini-2.5-flash-lite`). |

---

## 3. Assumptions vs. Facts

| Type | Assertion | Validation Status |
| :--- | :--- | :--- |
| **Fact** | Riya receives 80+ unstructured messages every morning across WhatsApp and email. | Verified via operational discovery. |
| **Fact** | Operational messages follow distinct urgency tiers (e.g. breakdown vs. POD confirmation). | Verified through logistics domain analysis. |
| **Fact** | Server-side API key containment is mandatory to prevent credential leakage. | Implemented via serverless backend proxy. |
| **Assumption** | Drivers frequently submit ambiguous messages lacking necessary shipment identifiers. | Validated in sample datasets; handled via dedicated `needs_review` classification. |
| **Assumption** | Operators prefer reviewing structured cards over interacting with a conversational chat bot. | Validated: dashboard card grid enables rapid scanning compared to slow linear chat threads. |

---

## 4. Failure Modes & Mitigations

```text
FAILURE MODE 1: Ambiguous Message (e.g., "Truck issue. Please check.")
- Risk: Model guesses that it's low priority or invents an order number.
- Mitigation: Classified as "needs_review"; model flags missing information (Vehicle #, Issue Type, Location) and drafts a polite clarification inquiry.

FAILURE MODE 2: AI Hallucination in Draft Reply
- Risk: Draft commits Riya to an unverified 30-minute delivery ETA.
- Mitigation: Anti-hallucination prompt instruction forbids promising specific ETAs or financial commitments. Editable draft interface forces human verification.

FAILURE MODE 3: Upstream AI Service Outage (HTTP 503 / 429)
- Risk: Triage fails completely during morning rush.
- Mitigation: Resilience engine retries up to 3 times with exponential backoff and automatically switches to alternative Gemini Flash models before returning a clean user notice.

FAILURE MODE 4: Local Storage Loss on Browser Refresh
- Risk: Riya loses her morning triage state if she accidentally reloads the page.
- Mitigation: All batches, message states, and user notes are saved reactively to browser IndexedDB.
```

---

## 5. Prioritization Framework (The 5 Core Pillars)

To maximize immediate impact, the MVP concentrates strictly on 5 core pillars:
1. **Prioritization:** Instantly segregate Critical/High operational issues from routine noise.
2. **Explainability:** Show *why* each item was prioritized, backed by direct quotes.
3. **Actionability:** Provide a recommended operational next step.
4. **Draft Assistance:** Pre-compose a safe, editable response.
5. **Human Oversight:** Give Riya simple controls to review, modify, action, or dismiss items.

---

## 6. Architecture Decision Record (ADR)

### ADR-01: Serverless Proxy Architecture with Local Client Persistence
- **Context:** The system needs to triage batches of operational text securely and quickly without introducing heavy cloud database maintenance.
- **Decision:** Build a React/Vite SPA hosted on Vercel backed by Node.js Serverless Functions (`/api/triage`, `/api/health`) that interact with the Gemini API server-side. Persist all batch data, operator notes, and status changes in client-side IndexedDB.
- **Trade-off:** Data is local to the operator's browser (no multi-user real-time sync across devices in MVP), but deployment is instantaneous, private, zero-maintenance, and highly secure.

---

## 7. FDE Takeaway

> **Problem → Constraint → Solution → Trade-off**
> 
> - **Problem:** Operations managers lose 90 minutes every morning manually sorting through 80+ chaotic WhatsApp messages.
> - **Constraint:** Cannot automate message sending due to high operational liability; must withstand AI provider latency spikes; must keep API keys secure.
> - **Solution:** A serverless, explainable AI triage dashboard that extracts verbatim evidence, isolates ambiguity in a "Needs Review" queue, drafts editable replies, and stores data locally in IndexedDB.
> - **Trade-off:** Requires manual copy-pasting for input and dispatch in MVP, but provides immediate operational value on Day 1 with zero risk of autonomous operational errors.
