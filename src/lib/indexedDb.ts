import {
  TriageBatch,
  DBStoredMessage,
  DBStoredTriageResult,
  ActivityLog,
  TriageMessageItem,
  BatchSummary,
} from '../types';

const DB_NAME = 'SmartInboxTriageDB';
const DB_VERSION = 1;

export const STORES = {
  BATCHES: 'batches',
  MESSAGES: 'messages',
  TRIAGE_RESULTS: 'triage_results',
  ACTIVITY_LOGS: 'activity_logs',
} as const;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`IndexedDB open failed: ${request.error?.message || 'Unknown error'}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Batches store
      if (!db.objectStoreNames.contains(STORES.BATCHES)) {
        const batchStore = db.createObjectStore(STORES.BATCHES, { keyPath: 'id' });
        batchStore.createIndex('created_at', 'created_at', { unique: false });
      }

      // Messages store
      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        const msgStore = db.createObjectStore(STORES.MESSAGES, { keyPath: 'id' });
        msgStore.createIndex('batch_id', 'batch_id', { unique: false });
      }

      // Triage Results store
      if (!db.objectStoreNames.contains(STORES.TRIAGE_RESULTS)) {
        const triageStore = db.createObjectStore(STORES.TRIAGE_RESULTS, { keyPath: 'id' });
        triageStore.createIndex('batch_id', 'batch_id', { unique: false });
        triageStore.createIndex('message_id', 'message_id', { unique: false });
        triageStore.createIndex('priority', 'priority', { unique: false });
        triageStore.createIndex('resolved', 'resolved', { unique: false });
      }

      // Activity logs store
      if (!db.objectStoreNames.contains(STORES.ACTIVITY_LOGS)) {
        const logStore = db.createObjectStore(STORES.ACTIVITY_LOGS, { keyPath: 'id' });
        logStore.createIndex('batch_id', 'batch_id', { unique: false });
      }
    };
  });
}

/**
 * Saves a complete triage batch, all individual messages, triage results, and an initial activity log.
 */
export async function saveBatchWithResults(
  batch: TriageBatch,
  messages: TriageMessageItem[]
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.BATCHES, STORES.MESSAGES, STORES.TRIAGE_RESULTS, STORES.ACTIVITY_LOGS],
      'readwrite'
    );

    transaction.onerror = () => {
      reject(new Error(`Transaction failed: ${transaction.error?.message || 'Unknown error'}`));
    };

    transaction.oncomplete = () => {
      resolve();
    };

    const batchStore = transaction.objectStore(STORES.BATCHES);
    const msgStore = transaction.objectStore(STORES.MESSAGES);
    const triageStore = transaction.objectStore(STORES.TRIAGE_RESULTS);
    const logStore = transaction.objectStore(STORES.ACTIVITY_LOGS);

    // 1. Put batch
    batchStore.put(batch);

    // 2. Put messages and triage results
    messages.forEach((msg, index) => {
      const storedMsg: DBStoredMessage = {
        id: msg.id,
        batch_id: batch.id,
        source: 'manual_batch_paste',
        original_message: msg.original_message,
        created_at: batch.created_at,
        order_index: index,
      };
      msgStore.put(storedMsg);

      const storedResult: DBStoredTriageResult = {
        ...msg,
        batch_id: batch.id,
        message_id: msg.id,
        created_at: batch.created_at,
        resolved: msg.resolved || false,
        edited_reply: msg.edited_reply || msg.draft_reply,
        order_index: index,
      };
      triageStore.put(storedResult);
    });

    // 3. Put activity log
    const log: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      batch_id: batch.id,
      event: 'BATCH_TRIAGED',
      details: `Triaged ${messages.length} messages (${batch.summary.critical_count} critical, ${batch.summary.high_count} high, ${batch.summary.needs_review_count} needs review)`,
      created_at: new Date().toISOString(),
    };
    logStore.put(log);
  });
}

/**
 * Retrieves all stored batches ordered by creation date descending.
 */
export async function getAllBatches(): Promise<TriageBatch[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.BATCHES], 'readonly');
    const store = transaction.objectStore(STORES.BATCHES);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const batches: TriageBatch[] = request.result || [];
      // Sort newest first
      batches.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      resolve(batches);
    };
  });
}

/**
 * Retrieves a specific batch along with its triaged message items.
 */
export async function getBatchWithItems(
  batchId: string
): Promise<{ batch: TriageBatch; items: TriageMessageItem[] } | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.BATCHES, STORES.TRIAGE_RESULTS], 'readonly');
    const batchStore = transaction.objectStore(STORES.BATCHES);
    const triageStore = transaction.objectStore(STORES.TRIAGE_RESULTS);

    const batchReq = batchStore.get(batchId);
    let batch: TriageBatch | null = null;
    let items: TriageMessageItem[] = [];

    batchReq.onerror = () => reject(batchReq.error);
    batchReq.onsuccess = () => {
      batch = batchReq.result || null;
    };

    const index = triageStore.index('batch_id');
    const itemsReq = index.getAll(IDBKeyRange.only(batchId));

    itemsReq.onerror = () => reject(itemsReq.error);
    itemsReq.onsuccess = () => {
      const results: DBStoredTriageResult[] = itemsReq.result || [];
      // Sort by order_index if present
      results.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
      items = results;
    };

    transaction.oncomplete = () => {
      if (!batch) {
        resolve(null);
      } else {
        resolve({ batch, items });
      }
    };
  });
}

/**
 * Updates a single triage result (e.g. marking resolved, editing draft reply, adding user notes)
 */
export async function updateTriageResult(
  resultId: string,
  updates: Partial<TriageMessageItem>
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.TRIAGE_RESULTS, STORES.BATCHES], 'readwrite');
    const triageStore = transaction.objectStore(STORES.TRIAGE_RESULTS);

    const getReq = triageStore.get(resultId);

    getReq.onerror = () => reject(getReq.error);
    getReq.onsuccess = () => {
      const existing: DBStoredTriageResult = getReq.result;
      if (!existing) {
        reject(new Error(`Triage result ${resultId} not found`));
        return;
      }

      const updated = {
        ...existing,
        ...updates,
      };

      triageStore.put(updated);
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Re-calculates and updates summary counts for a batch
 */
export async function refreshBatchSummary(batchId: string): Promise<BatchSummary | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.BATCHES, STORES.TRIAGE_RESULTS], 'readwrite');
    const batchStore = transaction.objectStore(STORES.BATCHES);
    const triageStore = transaction.objectStore(STORES.TRIAGE_RESULTS);

    const batchReq = batchStore.get(batchId);
    const index = triageStore.index('batch_id');
    const itemsReq = index.getAll(IDBKeyRange.only(batchId));

    transaction.onerror = () => reject(transaction.error);

    transaction.oncomplete = () => {
      const batch: TriageBatch = batchReq.result;
      const items: DBStoredTriageResult[] = itemsReq.result || [];

      if (!batch) {
        resolve(null);
        return;
      }

      const summary: BatchSummary = {
        total_messages: items.length,
        critical_count: items.filter((i) => i.priority === 'critical').length,
        high_count: items.filter((i) => i.priority === 'high').length,
        medium_count: items.filter((i) => i.priority === 'medium').length,
        low_count: items.filter((i) => i.priority === 'low').length,
        needs_review_count: items.filter((i) => i.priority === 'needs_review').length,
        resolved_count: items.filter((i) => i.resolved).length,
      };

      batch.summary = summary;
      const updateReq = batchStore.put(batch);
      updateReq.onsuccess = () => resolve(summary);
    };
  });
}

/**
 * Deletes an entire batch and its associated records
 */
export async function deleteBatch(batchId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.BATCHES, STORES.MESSAGES, STORES.TRIAGE_RESULTS, STORES.ACTIVITY_LOGS],
      'readwrite'
    );

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();

    // 1. Delete batch
    transaction.objectStore(STORES.BATCHES).delete(batchId);

    // 2. Delete messages with batch_id
    const msgStore = transaction.objectStore(STORES.MESSAGES);
    const msgIndex = msgStore.index('batch_id');
    const msgReq = msgIndex.getAllKeys(IDBKeyRange.only(batchId));
    msgReq.onsuccess = () => {
      (msgReq.result as string[]).forEach((key) => msgStore.delete(key));
    };

    // 3. Delete triage results
    const triageStore = transaction.objectStore(STORES.TRIAGE_RESULTS);
    const triageIndex = triageStore.index('batch_id');
    const triageReq = triageIndex.getAllKeys(IDBKeyRange.only(batchId));
    triageReq.onsuccess = () => {
      (triageReq.result as string[]).forEach((key) => triageStore.delete(key));
    };

    // 4. Delete activity logs
    const logStore = transaction.objectStore(STORES.ACTIVITY_LOGS);
    const logIndex = logStore.index('batch_id');
    const logReq = logIndex.getAllKeys(IDBKeyRange.only(batchId));
    logReq.onsuccess = () => {
      (logReq.result as string[]).forEach((key) => logStore.delete(key));
    };
  });
}

/**
 * Clears ALL data from IndexedDB
 */
export async function clearAllLocalData(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.BATCHES, STORES.MESSAGES, STORES.TRIAGE_RESULTS, STORES.ACTIVITY_LOGS],
      'readwrite'
    );

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();

    transaction.objectStore(STORES.BATCHES).clear();
    transaction.objectStore(STORES.MESSAGES).clear();
    transaction.objectStore(STORES.TRIAGE_RESULTS).clear();
    transaction.objectStore(STORES.ACTIVITY_LOGS).clear();
  });
}

/**
 * Appends a custom activity log event
 */
export async function logActivity(batchId: string, event: string, details: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORES.ACTIVITY_LOGS], 'readwrite');
    const logStore = transaction.objectStore(STORES.ACTIVITY_LOGS);
    const log: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      batch_id: batchId,
      event,
      details,
      created_at: new Date().toISOString(),
    };
    logStore.put(log);
  } catch (err) {
    console.error('Failed to write activity log:', err);
  }
}
