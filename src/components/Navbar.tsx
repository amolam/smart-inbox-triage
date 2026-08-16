import React from 'react';
import {
  Inbox,
  ShieldCheck,
  History,
  HelpCircle,
  PlusCircle,
  Database,
  Truck,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onNewTriage: () => void;
  onOpenHistory: () => void;
  onOpenGuide: () => void;
  savedBatchesCount: number;
  currentBatchId?: string;
  hasActiveBatch: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewTriage,
  onOpenHistory,
  onOpenGuide,
  savedBatchesCount,
  currentBatchId,
  hasActiveBatch,
}) => {
  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md backdrop-blur-md bg-opacity-95"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Persona Info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">
                  Smart Inbox Triage
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Sparkles className="w-3 h-3 mr-1 text-amber-400" />
                  Gemini 3.7 Flash
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center space-x-2">
                <span>Ops Manager: <strong className="text-slate-200">Riya</strong></span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 hidden md:inline">Logistics Dispatch Hub</span>
              </div>
            </div>
          </div>

          {/* Center Principle Pill */}
          <div className="hidden lg:flex items-center px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1.5 shrink-0" />
            <span>AI Recommends • <strong className="text-white">Riya Decides</strong> (Human-in-the-Loop)</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {hasActiveBatch && (
              <button
                id="btn-new-triage"
                onClick={onNewTriage}
                className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                title="Paste new batch of messages"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">New Triage</span>
                <span className="sm:hidden">New</span>
              </button>
            )}

            <button
              id="btn-batch-history"
              onClick={onOpenHistory}
              className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 relative"
              title="View saved batches in local storage"
            >
              <History className="w-4 h-4 mr-1.5 text-slate-400" />
              <span>History</span>
              {savedBatchesCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-slate-700 text-slate-200 border border-slate-600">
                  {savedBatchesCount}
                </span>
              )}
            </button>

            <button
              id="btn-open-guide"
              onClick={onOpenGuide}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors focus:outline-none"
              title="Triage Rules & Decision Framework Guide"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
