import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { InputSection } from './components/InputSection';
import { ProgressIndicator } from './components/ProgressIndicator';
import { DashboardSummary } from './components/DashboardSummary';
import { MessageFilterBar } from './components/MessageFilterBar';
import { MessageCard } from './components/MessageCard';
import { MessageDetailDrawer } from './components/MessageDetailDrawer';
import { BatchHistoryModal } from './components/BatchHistoryModal';
import { GuideModal } from './components/GuideModal';
import {
  TriageBatch,
  TriageMessageItem,
  FilterState,
  SortMode,
  PriorityLevel,
  MessageCategory,
} from './types';
import {
  saveBatchWithResults,
  getAllBatches,
  getBatchWithItems,
  updateTriageResult,
  deleteBatch,
  clearAllLocalData,
  refreshBatchSummary,
} from './lib/indexedDb';
import {
  AlertCircle,
  CheckCircle2,
  Inbox,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Application State
  const [batches, setBatches] = useState<TriageBatch[]>([]);
  const [activeBatch, setActiveBatch] = useState<TriageBatch | null>(null);
  const [items, setItems] = useState<TriageMessageItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<TriageMessageItem | null>(null);

  // UI state
  const [isInputView, setIsInputView] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressStage, setProgressStage] = useState<
    'normalizing' | 'analyzing' | 'extracting' | 'persisting'
  >('normalizing');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Filter and Sort State
  const [filter, setFilter] = useState<FilterState>({
    priority: 'all',
    category: 'all',
    confidence: 'all',
    status: 'all',
    searchQuery: '',
  });
  const [sortMode, setSortMode] = useState<SortMode>('priority');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Load all batches on startup & load latest batch if exists
  const loadSavedBatches = useCallback(async (autoSelectLatest = false) => {
    try {
      const saved = await getAllBatches();
      setBatches(saved);

      if (autoSelectLatest && saved.length > 0) {
        const latest = saved[0];
        const details = await getBatchWithItems(latest.id);
        if (details) {
          setActiveBatch(details.batch);
          setItems(details.items);
          setIsInputView(false);
        }
      }
    } catch (err) {
      console.warn('Failed to load batches from IndexedDB:', err);
    }
  }, []);

  useEffect(() => {
    loadSavedBatches(true);
  }, [loadSavedBatches]);

  // Open a specific batch from history
  const handleSelectBatch = async (batchId: string) => {
    try {
      const details = await getBatchWithItems(batchId);
      if (details) {
        setActiveBatch(details.batch);
        setItems(details.items);
        setIsInputView(false);
        setSelectedItem(null);
        showToast(`Loaded Batch ${batchId.slice(-6).toUpperCase()}`);
      }
    } catch (err) {
      console.error('Error loading batch:', err);
      showToast('Could not load selected batch from local storage.');
    }
  };

  // Delete a batch
  const handleDeleteBatch = async (batchId: string) => {
    try {
      await deleteBatch(batchId);
      const updatedBatches = batches.filter((b) => b.id !== batchId);
      setBatches(updatedBatches);

      if (activeBatch?.id === batchId) {
        if (updatedBatches.length > 0) {
          handleSelectBatch(updatedBatches[0].id);
        } else {
          setActiveBatch(null);
          setItems([]);
          setIsInputView(true);
        }
      }
      showToast('Batch deleted from local storage.');
    } catch (err) {
      console.error('Error deleting batch:', err);
      showToast('Failed to delete batch.');
    }
  };

  // Clear all data
  const handleClearAllData = async () => {
    try {
      await clearAllLocalData();
      setBatches([]);
      setActiveBatch(null);
      setItems([]);
      setSelectedItem(null);
      setIsInputView(true);
      showToast('All local triage history cleared.');
    } catch (err) {
      console.error('Error clearing data:', err);
      showToast('Failed to clear local data.');
    }
  };

  // Start Gemini AI Triage
  const handleStartTriage = async (messagesList: string[], rawText: string) => {
    setErrorMessage(null);
    setIsLoading(true);
    setPendingCount(messagesList.length);
    setProgressStage('normalizing');

    try {
      setProgressStage('analyzing');

      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesList }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with error status ${response.status}`);
      }

      setProgressStage('extracting');
      const data = await response.json();

      if (!data?.messages || !Array.isArray(data.messages)) {
        throw new Error('Invalid response structure received from AI.');
      }

      setProgressStage('persisting');

      // Build batch record
      const batchId = `batch-${Date.now()}`;
      const nowIso = new Date().toISOString();

      const newBatch: TriageBatch = {
        id: batchId,
        created_at: nowIso,
        processed_at: nowIso,
        message_count: data.messages.length,
        status: 'completed',
        summary: {
          total_messages: data.messages.length,
          critical_count: data.batch_summary?.critical_count ?? 0,
          high_count: data.batch_summary?.high_count ?? 0,
          medium_count: data.batch_summary?.medium_count ?? 0,
          low_count: data.batch_summary?.low_count ?? 0,
          needs_review_count: data.batch_summary?.needs_review_count ?? 0,
          resolved_count: 0,
        },
      };

      const itemsWithOrder: TriageMessageItem[] = data.messages.map(
        (m: any, idx: number) => ({
          ...m,
          order_index: idx,
          resolved: false,
        })
      );

      // Save to IndexedDB
      try {
        await saveBatchWithResults(newBatch, itemsWithOrder);
      } catch (dbErr) {
        console.warn('Local storage write warning:', dbErr);
        showToast('Results generated, but could not be saved locally.');
      }

      setActiveBatch(newBatch);
      setItems(itemsWithOrder);
      setIsInputView(false);
      setSelectedItem(null);
      await loadSavedBatches(false);
      showToast(`Triaged ${itemsWithOrder.length} messages successfully!`);
    } catch (err: any) {
      console.error('Triage process failed:', err);
      setErrorMessage(
        err.message || "We couldn't analyse the messages right now. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Resolved status on a message
  const handleToggleResolved = async (id: string, currentResolved: boolean) => {
    const updatedStatus = !currentResolved;

    const newItems = items.map((item) =>
      item.id === id ? { ...item, resolved: updatedStatus } : item
    );
    setItems(newItems);

    if (selectedItem && selectedItem.id === id) {
      setSelectedItem({ ...selectedItem, resolved: updatedStatus });
    }

    try {
      await updateTriageResult(id, { resolved: updatedStatus });
      if (activeBatch) {
        const updatedSummary = await refreshBatchSummary(activeBatch.id);
        if (updatedSummary) {
          setActiveBatch({ ...activeBatch, summary: updatedSummary });
        }
      }
    } catch (err) {
      console.warn('Failed to update resolution status in IndexedDB:', err);
    }
  };

  // Mark all Low messages as resolved
  const handleMarkAllLowResolved = async () => {
    const newItems = items.map((item) =>
      item.priority === 'low' ? { ...item, resolved: true } : item
    );
    setItems(newItems);

    for (const item of items) {
      if (item.priority === 'low' && !item.resolved) {
        await updateTriageResult(item.id, { resolved: true }).catch(() => {});
      }
    }

    if (activeBatch) {
      const updatedSummary = await refreshBatchSummary(activeBatch.id);
      if (updatedSummary) {
        setActiveBatch({ ...activeBatch, summary: updatedSummary });
      }
    }
    showToast('Marked all low informational messages as resolved.');
  };

  // Save edited reply / user notes in drawer
  const handleSaveReply = async (
    id: string,
    editedReply: string,
    userNotes?: string
  ) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, edited_reply: editedReply, user_notes: userNotes } : item
    );
    setItems(newItems);

    if (selectedItem && selectedItem.id === id) {
      setSelectedItem({ ...selectedItem, edited_reply: editedReply, user_notes: userNotes });
    }

    try {
      await updateTriageResult(id, {
        edited_reply: editedReply,
        user_notes: userNotes,
      });
    } catch (err) {
      console.warn('Failed to save edited reply to IndexedDB:', err);
    }
  };

  // Copy reply to clipboard
  const handleCopyReply = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast('Reply copied to clipboard. Ready to paste in WhatsApp/Email.');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Clipboard copy error:', err);
    }
  };

  // Available categories for filter dropdown
  const availableCategories = useMemo(() => {
    const map = new Map<MessageCategory, number>();
    items.forEach((item) => {
      map.set(item.category, (map.get(item.category) || 0) + 1);
    });
    return Array.from(map.entries()).map(([category, count]) => ({ category, count }));
  }, [items]);

  // Priority sorting weights (Critical -> High -> Medium -> Needs Review -> Low)
  const priorityRank: Record<PriorityLevel, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    needs_review: 3,
    low: 4,
  };

  const confidenceRank: Record<string, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Priority filter
    if (filter.priority !== 'all') {
      result = result.filter((item) => item.priority === filter.priority);
    }

    // Category filter
    if (filter.category !== 'all') {
      result = result.filter((item) => item.category === filter.category);
    }

    // Confidence filter
    if (filter.confidence !== 'all') {
      result = result.filter((item) => item.confidence === filter.confidence);
    }

    // Status filter
    if (filter.status === 'pending') {
      result = result.filter((item) => !item.resolved);
    } else if (filter.status === 'resolved') {
      result = result.filter((item) => item.resolved);
    }

    // Search Query (searches original message, reason, action, category, draft reply)
    if (filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase();
      result = result.filter((item) => {
        return (
          item.original_message.toLowerCase().includes(q) ||
          item.reason.toLowerCase().includes(q) ||
          item.recommended_action.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.draft_reply.toLowerCase().includes(q) ||
          (item.user_notes && item.user_notes.toLowerCase().includes(q))
        );
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortMode === 'priority') {
        const pDiff = (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99);
        if (pDiff !== 0) return pDiff;
        return (a.order_index ?? 0) - (b.order_index ?? 0);
      }
      if (sortMode === 'original_order') {
        return (a.order_index ?? 0) - (b.order_index ?? 0);
      }
      if (sortMode === 'confidence') {
        const cDiff = (confidenceRank[a.confidence] ?? 99) - (confidenceRank[b.confidence] ?? 99);
        if (cDiff !== 0) return cDiff;
        return (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99);
      }
      if (sortMode === 'status') {
        if (a.resolved !== b.resolved) {
          return a.resolved ? 1 : -1;
        }
        return (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99);
      }
      return 0;
    });

    return result;
  }, [items, filter, sortMode]);

  // Drawer Navigation index
  const currentDrawerIndex = useMemo(() => {
    if (!selectedItem) return -1;
    return filteredItems.findIndex((i) => i.id === selectedItem.id);
  }, [selectedItem, filteredItems]);

  const handleNavigateDrawerPrev = () => {
    if (currentDrawerIndex > 0) {
      setSelectedItem(filteredItems[currentDrawerIndex - 1]);
    }
  };

  const handleNavigateDrawerNext = () => {
    if (currentDrawerIndex >= 0 && currentDrawerIndex < filteredItems.length - 1) {
      setSelectedItem(filteredItems[currentDrawerIndex + 1]);
    }
  };

  // Keyboard navigation for drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedItem) return;
      if (e.key === 'ArrowLeft') {
        handleNavigateDrawerPrev();
      } else if (e.key === 'ArrowRight') {
        handleNavigateDrawerNext();
      } else if (e.key === 'Escape') {
        setSelectedItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, currentDrawerIndex, filteredItems]);

  // Export handlers
  const handleExportJson = () => {
    if (!activeBatch) return;
    const exportData = {
      batch: activeBatch,
      messages: items,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triage_report_${activeBatch.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported JSON triage report.');
  };

  const handleExportCsv = () => {
    if (!activeBatch) return;
    const headers = [
      'ID',
      'Priority',
      'Category',
      'Confidence',
      'Original Message',
      'Reason',
      'Recommended Action',
      'Draft Reply',
      'Resolved',
    ];
    const rows = items.map((item) => [
      item.id,
      item.priority,
      item.category,
      item.confidence,
      `"${item.original_message.replace(/"/g, '""')}"`,
      `"${item.reason.replace(/"/g, '""')}"`,
      `"${item.recommended_action.replace(/"/g, '""')}"`,
      `"${(item.edited_reply || item.draft_reply).replace(/"/g, '""')}"`,
      item.resolved ? 'YES' : 'NO',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triage_report_${activeBatch.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported CSV triage report.');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        onNewTriage={() => {
          setIsInputView(true);
          setSelectedItem(null);
        }}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        savedBatchesCount={batches.length}
        currentBatchId={activeBatch?.id}
        hasActiveBatch={Boolean(activeBatch)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Error Alert */}
        {errorMessage && (
          <div className="max-w-4xl mx-auto mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between shadow-xs">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-rose-900 block">Triage Error</strong>
                <p className="text-xs sm:text-sm mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 p-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading Progress State */}
        {isLoading ? (
          <ProgressIndicator stage={progressStage} messageCount={pendingCount} />
        ) : isInputView ? (
          /* Input / Paste View */
          <InputSection onStartTriage={handleStartTriage} isLoading={isLoading} />
        ) : (
          /* Dashboard Results View */
          <div>
            {/* Top Summary Cards */}
            {activeBatch && (
              <DashboardSummary
                summary={activeBatch.summary}
                activePriorityFilter={filter.priority}
                onSelectPriorityFilter={(p) => setFilter({ ...filter, priority: p })}
                onExportJson={handleExportJson}
                onExportCsv={handleExportCsv}
                onMarkAllLowResolved={handleMarkAllLowResolved}
                batchTimestamp={activeBatch.created_at}
              />
            )}

            {/* Filter and Search Bar */}
            <MessageFilterBar
              filter={filter}
              onFilterChange={(updates) => setFilter((prev) => ({ ...prev, ...updates }))}
              sortMode={sortMode}
              onSortChange={setSortMode}
              totalFiltered={filteredItems.length}
              totalMessages={items.length}
              availableCategories={availableCategories}
            />

            {/* Messages List Grid */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No matching messages</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Try clearing your search query or selecting a different priority / category filter.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setFilter({
                      priority: 'all',
                      category: 'all',
                      confidence: 'all',
                      status: 'all',
                      searchQuery: '',
                    })
                  }
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredItems.map((item) => (
                  <MessageCard
                    key={item.id}
                    item={item}
                    onOpenDetails={(msg) => setSelectedItem(msg)}
                    onToggleResolved={handleToggleResolved}
                    onCopyReply={handleCopyReply}
                    isCopied={copiedId === item.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Slide-over Inspection & Draft Reply Drawer */}
      <MessageDetailDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSaveReply={handleSaveReply}
        onToggleResolved={handleToggleResolved}
        onNavigatePrev={handleNavigateDrawerPrev}
        onNavigateNext={handleNavigateDrawerNext}
        hasPrev={currentDrawerIndex > 0}
        hasNext={currentDrawerIndex >= 0 && currentDrawerIndex < filteredItems.length - 1}
        currentIndex={currentDrawerIndex}
        totalCount={filteredItems.length}
      />

      {/* Batch History Modal */}
      <BatchHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        batches={batches}
        currentBatchId={activeBatch?.id}
        onSelectBatch={handleSelectBatch}
        onDeleteBatch={handleDeleteBatch}
        onClearAllData={handleClearAllData}
      />

      {/* Decision Framework Guide Modal */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="app-toast-notification"
          className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-150 border border-slate-700"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
