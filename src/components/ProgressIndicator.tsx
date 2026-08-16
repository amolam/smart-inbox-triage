import React from 'react';
import { Loader2, Sparkles, Database, CheckCircle2 } from 'lucide-react';

interface ProgressIndicatorProps {
  stage: 'normalizing' | 'analyzing' | 'extracting' | 'persisting';
  messageCount: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ stage, messageCount }) => {
  return (
    <div id="triage-progress-modal" className="max-w-md mx-auto my-12 p-6 bg-white border border-slate-200 rounded-2xl shadow-xl text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-inner">
        <Sparkles className="w-7 h-7 animate-pulse text-indigo-600" />
      </div>

      <h2 className="text-lg font-bold text-slate-900 mb-1">
        Analysing {messageCount} Messages with Gemini…
      </h2>
      <p className="text-xs text-slate-500 mb-6">
        Applying operations decision framework to classify urgency, extract evidence, and draft responses.
      </p>

      {/* Steps List */}
      <div className="space-y-3 text-left text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-slate-700 font-medium">Batch parsed and normalised</span>
        </div>

        <div className="flex items-center space-x-2.5">
          {stage === 'analyzing' || stage === 'extracting' || stage === 'persisting' ? (
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
          )}
          <span className="text-slate-800 font-medium">
            Evaluating operational impact & vehicle status
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          {stage === 'extracting' || stage === 'persisting' ? (
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
          )}
          <span className="text-slate-600">
            Extracting factual quotes and drafting reply actions
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          {stage === 'persisting' ? (
            <Database className="w-4 h-4 text-indigo-600 animate-pulse shrink-0" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
          )}
          <span className="text-slate-600">
            Saving batch to local browser storage (IndexedDB)
          </span>
        </div>
      </div>
    </div>
  );
};
