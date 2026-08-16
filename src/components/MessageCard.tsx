import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle,
  HelpCircle,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Edit3,
} from 'lucide-react';
import { TriageMessageItem, PriorityLevel } from '../types';

interface MessageCardProps {
  item: TriageMessageItem;
  onOpenDetails: (item: TriageMessageItem) => void;
  onToggleResolved: (id: string, currentResolved: boolean) => void;
  onCopyReply: (text: string, id: string) => void;
  isCopied: boolean;
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

export const MessageCard: React.FC<MessageCardProps> = ({
  item,
  onOpenDetails,
  onToggleResolved,
  onCopyReply,
  isCopied,
}) => {
  const isResolved = item.resolved || false;

  const priorityStyles: Record<
    PriorityLevel,
    {
      badge: string;
      icon: any;
      cardBorder: string;
      cardBg: string;
      dot: string;
      label: string;
    }
  > = {
    critical: {
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: AlertCircle,
      cardBorder: isResolved ? 'border-slate-200' : 'border-rose-200 hover:border-rose-300',
      cardBg: isResolved ? 'bg-slate-50/60 opacity-80' : 'bg-white',
      dot: 'bg-rose-500 animate-ping',
      label: 'Critical',
    },
    high: {
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: AlertTriangle,
      cardBorder: isResolved ? 'border-slate-200' : 'border-amber-200 hover:border-amber-300',
      cardBg: isResolved ? 'bg-slate-50/60 opacity-80' : 'bg-white',
      dot: 'bg-amber-500',
      label: 'High',
    },
    medium: {
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Clock,
      cardBorder: isResolved ? 'border-slate-200' : 'border-blue-200 hover:border-blue-300',
      cardBg: isResolved ? 'bg-slate-50/60 opacity-80' : 'bg-white',
      dot: 'bg-blue-500',
      label: 'Medium',
    },
    needs_review: {
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: HelpCircle,
      cardBorder: isResolved ? 'border-slate-200' : 'border-purple-200 hover:border-purple-300',
      cardBg: isResolved ? 'bg-slate-50/60 opacity-80' : 'bg-white',
      dot: 'bg-purple-500',
      label: 'Needs Review',
    },
    low: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: CheckCircle,
      cardBorder: isResolved ? 'border-slate-200' : 'border-emerald-200 hover:border-emerald-300',
      cardBg: isResolved ? 'bg-slate-50/60 opacity-80' : 'bg-white',
      dot: 'bg-emerald-500',
      label: 'Low',
    },
  };

  const style = priorityStyles[item.priority] || priorityStyles.low;
  const PriorityIcon = style.icon;

  const activeReplyText = item.edited_reply || item.draft_reply;

  return (
    <div
      id={`message-card-${item.id}`}
      className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 shadow-xs relative ${
        style.cardBorder
      } ${style.cardBg} ${isResolved ? 'grayscale-[0.25]' : 'hover:shadow-md'}`}
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Badge */}
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${style.badge}`}
          >
            {item.priority === 'critical' && !isResolved && (
              <span className="relative flex h-2 w-2 mr-1.5">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${style.dot}`} />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
              </span>
            )}
            <PriorityIcon className="w-3.5 h-3.5 mr-1 shrink-0" />
            <span>{style.label}</span>
          </span>

          {/* Category Tag */}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {CATEGORY_LABELS[item.category] || item.category}
          </span>

          {/* Confidence Badge */}
          <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            Confidence: <strong className="text-slate-700 capitalize">{item.confidence}</strong>
          </span>

          {/* Edited indicator */}
          {item.edited_reply && item.edited_reply !== item.draft_reply && (
            <span className="inline-flex items-center text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
              <Edit3 className="w-2.5 h-2.5 mr-1" />
              Edited
            </span>
          )}
        </div>

        {/* Resolved Checkbox */}
        <div className="flex items-center space-x-2">
          <label
            htmlFor={`checkbox-resolved-${item.id}`}
            className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer select-none hover:text-slate-900"
          >
            <input
              id={`checkbox-resolved-${item.id}`}
              type="checkbox"
              checked={isResolved}
              onChange={() => onToggleResolved(item.id, isResolved)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className={isResolved ? 'line-through text-slate-400 font-medium' : 'font-medium'}>
              {isResolved ? 'Resolved' : 'Mark Resolved'}
            </span>
          </label>
        </div>
      </div>

      {/* Original Message Quote Box */}
      <div
        onClick={() => onOpenDetails(item)}
        className="cursor-pointer group rounded-xl p-3.5 bg-slate-50 border border-slate-200/80 mb-3 hover:bg-slate-100/80 transition-colors"
      >
        <p className="text-xs sm:text-sm font-medium text-slate-900 leading-relaxed group-hover:text-indigo-950">
          &ldquo;{item.original_message}&rdquo;
        </p>
      </div>

      {/* AI Reasoning & Evidence Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-xs">
        {/* Why this priority */}
        <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/60">
          <span className="font-semibold text-slate-700 block mb-1 text-[11px] uppercase tracking-wide">
            Reason
          </span>
          <p className="text-slate-600 leading-relaxed">{item.reason}</p>
        </div>

        {/* Recommended Action */}
        <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
          <span className="font-semibold text-indigo-900 block mb-1 text-[11px] uppercase tracking-wide flex items-center">
            <ArrowRight className="w-3 h-3 mr-1 text-indigo-600" />
            Recommended Next Step
          </span>
          <p className="text-indigo-950 font-medium leading-relaxed">{item.recommended_action}</p>
        </div>
      </div>

      {/* Evidence Quotes Pills */}
      {item.evidence && item.evidence.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px]">
          <span className="text-slate-500 font-medium">Evidence quotes:</span>
          {item.evidence.map((quote, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[11px]"
            >
              &quot;{quote}&quot;
            </span>
          ))}
        </div>
      )}

      {/* Missing Information Notice for Needs Review */}
      {item.priority === 'needs_review' && item.missing_information && item.missing_information.length > 0 && (
        <div className="mb-3 p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block text-purple-950">
              Information required before action:
            </strong>
            <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-purple-800 text-[11px]">
              {item.missing_information.map((info, idx) => (
                <li key={idx}>{info}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Draft Reply Preview & Actions */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex-1 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 font-sans italic truncate">
          <span className="font-semibold text-slate-800 not-italic mr-1.5">Suggested Reply:</span>
          &ldquo;{activeReplyText}&rdquo;
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            id={`btn-copy-reply-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onCopyReply(activeReplyText, item.id);
            }}
            className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isCopied
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
            }`}
            title="Copy response to clipboard to send manually"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />
                <span>Copy Reply</span>
              </>
            )}
          </button>

          <button
            type="button"
            id={`btn-review-details-${item.id}`}
            onClick={() => onOpenDetails(item)}
            className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-2xs"
          >
            <span>Review & Edit</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
