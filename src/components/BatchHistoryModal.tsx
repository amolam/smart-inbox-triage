import React, { useState } from 'react';
import {
  X,
  History,
  Calendar,
  Layers,
  AlertCircle,
  CheckCircle,
  Trash2,
  FolderOpen,
  Database,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { TriageBatch } from '../types';

interface BatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: TriageBatch[];
  currentBatchId?: string;
  onSelectBatch: (batchId: string) => void;
  onDeleteBatch: (batchId: string) => void;
  onClearAllData: () => void;
}

export const BatchHistoryModal: React.FC<BatchHistoryModalProps> = ({
  isOpen,
  onClose,
  batches,
  currentBatchId,
  onSelectBatch,
  onDeleteBatch,
  onClearAllData,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="batch-history-modal"
        className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Local Triage Batches</h3>
              <p className="text-xs text-slate-400">
                Persistent local storage (IndexedDB) • Available offline & across reloads
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-history"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Note */}
        <div className="px-6 py-2.5 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All message batches and triaged records stay 100% in your browser.</span>
          </div>
          <span className="font-semibold text-indigo-700">IndexedDB Storage</span>
        </div>

        {/* Batches List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {batches.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <Database className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No saved batches yet.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Paste and triage your first batch of messages to save them locally.
              </p>
            </div>
          ) : (
            batches.map((batch) => {
              const isCurrent = batch.id === currentBatchId;
              const dateStr = new Date(batch.created_at).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={batch.id}
                  id={`history-batch-item-${batch.id}`}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-500 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">
                        Batch {batch.id.slice(-6).toUpperCase()}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                          Active View
                        </span>
                      )}
                      <span className="text-xs text-slate-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                        {dateStr}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {batch.message_count} Messages
                      </span>

                      {batch.summary?.critical_count > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold">
                          🔴 {batch.summary.critical_count} Critical
                        </span>
                      )}

                      {batch.summary?.high_count > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-medium">
                          🟠 {batch.summary.high_count} High
                        </span>
                      )}

                      {batch.summary?.needs_review_count > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-medium">
                          ⚪ {batch.summary.needs_review_count} Needs Review
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      id={`btn-open-batch-${batch.id}`}
                      onClick={() => {
                        onSelectBatch(batch.id);
                        onClose();
                      }}
                      className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                    >
                      <FolderOpen className="w-3.5 h-3.5 mr-1" />
                      <span>{isCurrent ? 'Viewing' : 'Open'}</span>
                    </button>

                    <button
                      type="button"
                      id={`btn-delete-batch-${batch.id}`}
                      onClick={() => onDeleteBatch(batch.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete this batch from local storage"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          {!showClearConfirm ? (
            <button
              type="button"
              id="btn-trigger-clear-all"
              onClick={() => setShowClearConfirm(true)}
              disabled={batches.length === 0}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>Clear All Local Data</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 bg-rose-50 p-1.5 px-3 rounded-xl border border-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="text-xs text-rose-900 font-semibold">Delete everything?</span>
              <button
                type="button"
                id="btn-confirm-clear-all"
                onClick={() => {
                  onClearAllData();
                  setShowClearConfirm(false);
                  onClose();
                }}
                className="px-2 py-0.5 rounded text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
              >
                Yes, Clear
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-0.5 rounded text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
