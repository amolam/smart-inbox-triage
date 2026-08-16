import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle,
  HelpCircle,
  Copy,
  Check,
  RotateCcw,
  Save,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Edit3,
  StickyNote,
} from 'lucide-react';
import { TriageMessageItem, PriorityLevel } from '../types';

interface MessageDetailDrawerProps {
  item: TriageMessageItem | null;
  onClose: () => void;
  onSaveReply: (id: string, editedReply: string, userNotes?: string) => void;
  onToggleResolved: (id: string, currentResolved: boolean) => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalCount?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  vehicle_breakdown: 'Vehicle Breakdown',
  driver_issue: 'Driver Issue',
  pickup_issue: 'Pickup Issue',
  delivery_delay: 'Delivery Delay',
  delivery_issue: 'Delivery Issue',
  vendor_issue: 'Vendor Issue',
  customer_escalation: 'Customer Escalation',
  reschedule_request: 'Reschedule Request',
  operational_exception: 'Operational Exception',
  delivery_confirmation: 'Delivery Confirmation',
  routine_update: 'Routine Update',
  other: 'Other',
};

export const MessageDetailDrawer: React.FC<MessageDetailDrawerProps> = ({
  item,
  onClose,
  onSaveReply,
  onToggleResolved,
  onNavigatePrev,
  onNavigateNext,
  hasPrev,
  hasNext,
  currentIndex = 0,
  totalCount = 0,
}) => {
  const [replyText, setReplyText] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSourceCopied, setIsSourceCopied] = useState<boolean>(false);
  const [isSavedToast, setIsSavedToast] = useState<boolean>(false);

  useEffect(() => {
    if (item) {
      setReplyText(item.edited_reply || item.draft_reply || '');
      setUserNotes(item.user_notes || '');
      setIsCopied(false);
      setIsSourceCopied(false);
      setIsSavedToast(false);
    }
  }, [item]);

  if (!item) return null;

  const handleCopyReply = async () => {
    try {
      await navigator.clipboard.writeText(replyText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleCopySource = async () => {
    try {
      await navigator.clipboard.writeText(item.original_message);
      setIsSourceCopied(true);
      setTimeout(() => setIsSourceCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy source:', err);
    }
  };

  const handleSave = () => {
    onSaveReply(item.id, replyText, userNotes);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2000);
  };

  const handleResetToAi = () => {
    setReplyText(item.draft_reply);
  };

  const priorityConfigs: Record<
    PriorityLevel,
    { label: string; bg: string; text: string; icon: any; border: string }
  > = {
    critical: {
      label: 'Critical Priority',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      icon: AlertCircle,
    },
    high: {
      label: 'High Priority',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: AlertTriangle,
    },
    medium: {
      label: 'Medium Priority',
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
      icon: Clock,
    },
    needs_review: {
      label: 'Needs Review',
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
      icon: HelpCircle,
    },
    low: {
      label: 'Low Priority',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      icon: CheckCircle,
    },
  };

  const pConfig = priorityConfigs[item.priority] || priorityConfigs.low;
  const PIcon = pConfig.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end transition-opacity">
      {/* Click outside backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Content */}
      <div
        id="message-detail-drawer"
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Message {currentIndex + 1} of {totalCount}
            </span>
            <h3 className="font-bold text-base text-white">Operational Triage Review</h3>
          </div>

          <div className="flex items-center space-x-2">
            {hasPrev && (
              <button
                type="button"
                onClick={onNavigatePrev}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Previous message"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {hasNext && (
              <button
                type="button"
                onClick={onNavigateNext}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Next message"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              id="btn-close-drawer"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Priority & Category Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border ${pConfig.bg} ${pConfig.text} ${pConfig.border}`}
              >
                <PIcon className="w-4 h-4 mr-1.5 shrink-0" />
                <span>{pConfig.label}</span>
              </span>

              <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium bg-white text-slate-800 border border-slate-200 shadow-2xs">
                {CATEGORY_LABELS[item.category] || item.category}
              </span>

              <span className="text-xs text-slate-600 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                Confidence: <strong className="text-slate-900 capitalize">{item.confidence}</strong>
              </span>
            </div>

            <button
              type="button"
              id="btn-toggle-resolve-drawer"
              onClick={() => onToggleResolved(item.id, item.resolved || false)}
              className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                item.resolved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              <span>{item.resolved ? 'Resolved' : 'Mark as Resolved'}</span>
            </button>
          </div>

          {/* Source Message Block */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Original Message
              </span>
              <button
                type="button"
                id="btn-copy-source"
                onClick={handleCopySource}
                className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                {isSourceCopied ? (
                  <>
                    <Check className="w-3 h-3 mr-1 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm leading-relaxed shadow-inner border border-slate-800">
              {item.original_message}
            </div>
          </div>

          {/* Reasoning & Evidence Section */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide block mb-1.5">
                Why was this priority assigned?
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{item.reason}</p>
            </div>

            {/* Extracted Evidence */}
            {item.evidence && item.evidence.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide block mb-2">
                  Evidence from Message (Factual Citations)
                </span>
                <div className="flex flex-wrap gap-2">
                  {item.evidence.map((quote, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white text-slate-800 border border-slate-200 text-xs font-mono shadow-2xs"
                    >
                      &ldquo;{quote}&rdquo;
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Action */}
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide flex items-center mb-1.5">
                <ArrowRight className="w-4 h-4 mr-1.5 text-indigo-600" />
                Recommended Next Step for Riya
              </span>
              <p className="text-xs sm:text-sm text-indigo-950 font-medium leading-relaxed">
                {item.recommended_action}
              </p>
            </div>

            {/* Missing Information for Needs Review */}
            {item.priority === 'needs_review' &&
              item.missing_information &&
              item.missing_information.length > 0 && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs sm:text-sm text-purple-950">
                  <span className="text-xs font-bold uppercase tracking-wide block mb-2 text-purple-900 flex items-center">
                    <HelpCircle className="w-4 h-4 mr-1.5 text-purple-600" />
                    Missing Operational Information (Safeguard)
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-purple-900">
                    {item.missing_information.map((info, idx) => (
                      <li key={idx}>{info}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-purple-700 italic">
                    AI does not guess or manufacture certainty. Ask the sender for the details above.
                  </p>
                </div>
              )}
          </div>

          {/* Draft Reply Editor */}
          <div className="p-5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Suggested Draft Reply (Editable)
                </span>
              </div>
              {item.draft_reply !== replyText && (
                <button
                  type="button"
                  id="btn-reset-draft"
                  onClick={handleResetToAi}
                  className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 font-medium"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  <span>Reset to AI Draft</span>
                </button>
              )}
            </div>

            <textarea
              id="textarea-draft-reply"
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors leading-relaxed font-sans"
              placeholder="Type or edit reply..."
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Never auto-sent. Copy & send manually via WhatsApp/Email.</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="btn-save-draft"
                  onClick={handleSave}
                  className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  id="btn-copy-draft-main"
                  onClick={handleCopyReply}
                  className={`inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      <span>Copy Reply</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {isSavedToast && (
              <div className="text-xs text-emerald-600 font-medium text-right animate-fade-in">
                ✓ Draft saved to local IndexedDB!
              </div>
            )}
          </div>

          {/* Internal Operations Notes */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
              <StickyNote className="w-3.5 h-3.5 text-amber-500" />
              <span>Internal Ops Handover Notes</span>
            </div>
            <textarea
              id="textarea-user-notes"
              rows={2}
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              onBlur={handleSave}
              placeholder="Add optional notes for team handover (e.g. 'Assigned backup truck MH12 JK8899')..."
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Drawer Footer Navigation */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onNavigatePrev}
            disabled={!hasPrev}
            className={`inline-flex items-center px-3 py-2 text-xs font-semibold rounded-xl ${
              hasPrev
                ? 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                : 'text-slate-400 cursor-not-allowed bg-transparent'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onNavigateNext}
            disabled={!hasNext}
            className={`inline-flex items-center px-3 py-2 text-xs font-semibold rounded-xl ${
              hasNext
                ? 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                : 'text-slate-400 cursor-not-allowed bg-transparent'
            }`}
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
