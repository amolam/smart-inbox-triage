# Technical Architecture Documentation

## System: Smart Inbox Triage
**Framework:** React 18, TypeScript, Tailwind CSS v4, Vercel Serverless, Google Gen AI SDK  
**Persistence:** Browser IndexedDB (`smart_inbox_triage_db`)  
**Deployment Target:** Vercel (Edge/Serverless Network)  

---

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Client [Browser Client - React 18 SPA]
        A[Operator Riya] -->|Pastes Batch / Selects Preset| B[InputSection.tsx]
        B --> C[messageParser.ts]
        C --> D[App.tsx State Orchestrator]
        D -->|Renders Metrics & Filters| E[DashboardSummary.tsx & MessageFilterBar.tsx]
        D -->|Renders Cards| F[MessageCard.tsx Grid]
        F -->|Inspect / Edit Note / Copy Draft| G[MessageDetailDrawer.tsx]
        D <-->|Persists Batches & Status| H[(Browser IndexedDB)]
        I[BatchHistoryModal.tsx] <-->|Load / Export / Delete| H
    end

    subgraph Backend [Vercel Serverless Layer]
        D -->|POST /api/triage| J[api/triage.ts]
        D -->|GET /api/health| K[api/health.ts]
        J --> L[api/_triageEngine.ts]
        L --> M[Server-Side process.env.GEMINI_API_KEY]
    end

    subgraph AI [Google Gemini Foundation Layer]
        L -->|1. Call Model gemini-2.5-flash| N[Gemini API]
        N -.->|Transient 503/429 Fallback| O[Gemini 3.6 Flash / 2.5 Flash Lite]
        N -->|Structured JSON Response| P[Schema Validation & Sanitization]
        O -->|Structured JSON Response| P
    end

    P -->|BatchTriageResponse JSON| J
    J -->|HTTP 200 OK| D
```

---

## 2. Component & Module Architecture

### 2.1 Frontend Components (`src/components/`)
- **`App.tsx`**: Central state controller coordinating message parsing, serverless API communication, IndexedDB persistence, active filter application, drawer selection, and batch management.
- **`InputSection.tsx`**: Raw text input textarea supporting direct paste, CSV/text file drag-and-drop, character counts, and quick-load demo presets.
- **`DashboardSummary.tsx`**: Top-level metric cards displaying counts for `Total`, `Critical`, `High`, `Medium`, `Low`, and `Needs Review` with one-click filter triggers.
- **`MessageFilterBar.tsx`**: Granular filtering controls for Priority, Category, Confidence, and Status (`pending`, `reviewed`, `actioned`, `dismissed`), alongside a debounce-assisted keyword search bar.
- **`MessageCard.tsx`**: Individual triage card showcasing urgency badges, category tags, confidence indicators, reason summaries, evidence chips, and quick-action buttons.
- **`MessageDetailDrawer.tsx`**: Slide-over deep-dive panel enabling side-by-side inspection of original text, reason, evidence, recommended action, editable draft reply, and operator custom notes.
- **`BatchHistoryModal.tsx`**: Historical batch viewer allowing Riya to inspect previously saved triage sessions, export data as CSV/JSON, or clear local storage.
- **`GuideModal.tsx`**: Embedded documentation modal explaining the 5-tier classification framework and triage heuristics.
- **`Navbar.tsx`**: Header component featuring brand identity, connection status indicator, and quick-access triggers for history and guide modals.
- **`ProgressIndicator.tsx`**: Animated visual progress bar showing AI analysis state during batch processing.

### 2.2 Utility Modules (`src/lib/`)
- **`messageParser.ts`**: Intelligent parser that converts messy unstructured text into clean string arrays by handling:
  - Blank-line separated blocks (`\n\n`)
  - Numbered lists (`1.`, `2.`, `[1]`, `(1)`)
  - WhatsApp timestamp headers (`[09:12 AM] Driver: ...`)
  - Bulleted points (`-`, `*`, `•`)
- **`indexedDb.ts`**: Production IndexedDB wrapper managing three object stores:
  - `batches`: Metadata, timestamp, title, summary stats, and message arrays.
  - `messages`: Indexed by `batch_id`, `priority`, `category`, and `status`.
  - `activity_logs`: Timestamped audit trail of triage runs, status updates, and note edits.

### 2.3 Serverless Backend (`api/`)
- **`api/_triageEngine.ts`**: Shared TypeScript module containing the Gemini system instruction, response schema, validation rules, 15-message batch chunker, exponential backoff handler, and model fallback controller.
- **`api/triage.ts`**: Vercel Serverless Function entrypoint (`POST /api/triage`) with `maxDuration: 60`, CORS preflight handling, and error masking.
- **`api/health.ts`**: Vercel Serverless Function entrypoint (`GET /api/health`) reporting system status and confirming `GEMINI_API_KEY` configuration.

### 2.4 Local Development Server (`server.ts`)
- Standalone Express 4 application importing `executeTriage` from `./api/_triageEngine.js` and mounting Vite middleware for unified local development (`npm run dev`) and container execution.

---

## 3. End-to-End Request Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Riya as Operations Manager (Riya)
    participant UI as React UI (App.tsx)
    participant Parser as messageParser.ts
    participant IDB as Browser IndexedDB
    participant API as Vercel Function (api/triage.ts)
    participant Engine as Triage Engine (api/_triageEngine.ts)
    participant Gemini as Google Gemini API

    Riya->>UI: Pastes raw 80-message log & clicks "Triage"
    UI->>Parser: parseRawMessages(rawText)
    Parser-->>UI: string[80] parsed messages
    UI->>API: POST /api/triage { messages: string[80] }
    API->>Engine: executeTriage(messages)
    
    loop For each chunk of 15 messages
        Engine->>Gemini: generateContent(gemini-2.5-flash, prompt, schema)
        alt Success
            Gemini-->>Engine: Structured JSON Response
        else Transient 503 / 429 Error
            Engine->>Engine: Wait ~1s (Backoff + Jitter)
            Engine->>Gemini: generateContent(gemini-3.6-flash)
            Gemini-->>Engine: Structured JSON Response
        end
        Engine->>Engine: sanitizeMessageResult() validation
    end

    Engine-->>API: BatchTriageResponse (80 triaged items + summary)
    API-->>UI: HTTP 200 JSON
    UI->>IDB: saveBatch(batchRecord)
    UI->>UI: Update state & render urgency cards
    UI-->>Riya: Displays 5 Critical, 8 High, 4 Needs Review cards
```

---

## 4. Security & Data Privacy Architecture

- **Zero Client-Side Secret Exposure:** The Google Gemini API key is never bundled in frontend code or exposed via `import.meta.env`. It is accessed strictly server-side through `process.env.GEMINI_API_KEY`.
- **Zero Server-Side Storage:** The Vercel serverless layer is completely stateless. No operational messages, customer names, or phone numbers are written to server disks or remote databases.
- **Local Data Sandbox:** All persistent data resides within the user's browser IndexedDB sandbox, ensuring compliance with data privacy expectations.

---

## 5. Resilience & Fault-Tolerance Architecture

```mermaid
flowchart TD
    Start[Execute Gemini Chunk Request] --> Try1[Attempt 1: gemini-2.5-flash]
    Try1 -->|Success| Clean[Sanitize & Validate JSON]
    Try1 -->|503 / 429 / Network Err| Delay1[Wait ~1000ms + Jitter]
    Delay1 --> Try2[Attempt 2: gemini-3.6-flash]
    Try2 -->|Success| Clean
    Try2 -->|503 / 429 / Network Err| Delay2[Wait ~2000ms + Jitter]
    Delay2 --> Try3[Attempt 3: gemini-2.5-flash-lite]
    Try3 -->|Success| Clean
    Try3 -->|Failed All Attempts| Throw503[Throw Clean 503 Unavailable Notice]
    Clean --> Return[Return Validated Batch]
```

---

## 6. Architecture Decision Records (ADRs)

| Decision | Context & Need | Benefit | Trade-off | Future Evolution |
| :--- | :--- | :--- | :--- | :--- |
| **ADR-01: Shared Triage Engine** | Keep local development (`server.ts`) and Vercel serverless functions (`api/*.ts`) in sync. | Single source of truth for prompts, schemas, and retries. | Requires explicit ESM `.js` import specifiers. | Extract into internal `@workspace/core` package if microservices are added. |
| **ADR-02: Client-Side IndexedDB** | Store batches and user notes without spinning up costly cloud databases. | Zero cloud hosting cost; complete operator privacy; offline-tolerant storage. | Data does not sync across multiple devices or operators. | Add optional remote PostgreSQL / Firebase sync in Phase 3. |
| **ADR-03: 15-Item Chunking** | Processing 80+ messages in a single AI prompt risks timeout and token truncation. | Fast parallelizable throughput; protects against single-message parse failure. | Multiple API calls per large batch. | Implement dynamic token-aware adaptive chunk sizing. |
| **ADR-04: Multi-Model Fallback** | Production Gemini API spikes (HTTP 503) cause transient failures. | 99.9% resilience during morning peak hours. | Minor variation in latency across fallback models. | Add automated multi-region failover. |

---

## 7. Current vs. Future Architecture

```text
CURRENT ARCHITECTURE (MVP):
[Raw Input] -> [React Client] -> [POST /api/triage] -> [Vercel Function] -> [Gemini API] -> [IndexedDB]

FUTURE ARCHITECTURE (Production Scaled):
[WhatsApp Webhook / Gmail IMAP] 
         │
         ▼
[Message Ingestion Pipeline (Cloud Run / PubSub)]
         │
         ▼
[Centralized Triage Engine + TMS Connector]
         │
         ▼
[PostgreSQL Database (Multi-Tenant & Audited)]
         │
         ▼
[Real-Time Operations Dashboard (WebSockets)]
```
