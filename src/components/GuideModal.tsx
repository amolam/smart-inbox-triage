import React from 'react';
import {
  X,
  BookOpen,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Clock,
  HelpCircle,
  CheckCircle,
  Sparkles,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="guide-modal"
        className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Operations Triage Decision Framework</h3>
              <p className="text-xs text-slate-400">Rules and Safeguards configured for Gemini 3.7 Flash</p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-guide"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Core Philosophy Banner */}
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
            <h4 className="font-bold text-indigo-950 text-sm flex items-center mb-1">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-indigo-600" />
              Core Principle: AI Recommends • Riya Decides
            </h4>
            <p className="text-indigo-900 text-xs leading-relaxed">
              Smart Inbox Triage is an AI-assisted triage tool, not an autonomous decision-maker.
              It eliminates the 1-hour morning reading bottleneck while keeping 100% of the operational control with Riya.
              No messages are ever sent automatically.
            </p>
          </div>

          {/* Urgency Classification Framework */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide mb-3">
              1. Urgency Levels
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                <strong className="text-rose-900 font-bold flex items-center mb-1">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                  🔴 Critical (Immediate Action)
                </strong>
                <p className="text-rose-800">
                  Active vehicle breakdowns, driver incapacitated, blocked pickups/deliveries, major customer contract escalations, or severe temperature excursions.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <strong className="text-amber-900 font-bold flex items-center mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  🟠 High (Action Soon)
                </strong>
                <p className="text-amber-800">
                  Significant operational delays (&gt;1 hr), port clearance stalls, highway waterlogging delays, or customer requests for immediate status.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <strong className="text-blue-900 font-bold flex items-center mb-1">
                  <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  🟡 Medium (Action Required)
                </strong>
                <p className="text-blue-800">
                  Rescheduling requests for tomorrow or future dates, advance paperwork queries, or non-urgent adjustments.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                <strong className="text-purple-900 font-bold flex items-center mb-1">
                  <HelpCircle className="w-3.5 h-3.5 mr-1 text-purple-600" />
                  ⚪ Needs Review (Vague / Incomplete)
                </strong>
                <p className="text-purple-800">
                  When messages are vague (e.g. &quot;Problem with delivery&quot;) or evidence is insufficient. AI flags missing information instead of guessing.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 md:col-span-2">
                <strong className="text-emerald-900 font-bold flex items-center mb-1">
                  <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  🟢 Low (Informational)
                </strong>
                <p className="text-emerald-800">
                  Confirmed successful deliveries, routine temperature logs, payment confirmations, or driver gate arrival notifications.
                </p>
              </div>
            </div>
          </div>

          {/* Anti-Hallucination & Recall Principles */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
              2. Guardrails & Safety
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start">
                <ArrowRight className="w-3.5 h-3.5 text-indigo-600 mr-2 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-900">Cost-Sensitive Recall:</strong> Prioritizes critical-message recall over excessive precision. Uncertain potential issues are marked for review rather than silently downgraded.
                </span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="w-3.5 h-3.5 text-indigo-600 mr-2 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-900">Verbatim Evidence:</strong> The AI extracts exact quotations from the source text and never invents order numbers, ETAs, customer names, or vehicle locations.
                </span>
              </li>
              <li className="flex items-start">
                <ArrowRight className="w-3.5 h-3.5 text-indigo-600 mr-2 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-900">100% Browser Persistence (IndexedDB):</strong> Data remains in the user&apos;s browser. No external databases (no Supabase) are used.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-xs"
          >
            Got it, Back to Triage
          </button>
        </div>
      </div>
    </div>
  );
};
