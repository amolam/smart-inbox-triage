import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ClipboardPaste,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileText,
  Zap,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { parseAndNormaliseBatch } from '../lib/messageParser';
import { DEMO_PRESETS, DemoBatchPreset } from '../data/demoData';

interface InputSectionProps {
  onStartTriage: (messages: string[], rawText: string) => void;
  isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onStartTriage, isLoading }) => {
  const [inputText, setInputText] = useState<string>('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  // Real-time parsing of input text
  const parseResult = useMemo(() => {
    return parseAndNormaliseBatch(inputText);
  }, [inputText]);

  // Load demo preset into textarea
  const handleSelectPreset = (preset: DemoBatchPreset) => {
    setInputText(preset.text);
    setSelectedPresetId(preset.id);
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputText(text);
          setSelectedPresetId('');
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed or permission denied:', err);
    }
  };

  const handleClear = () => {
    setInputText('');
    setSelectedPresetId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseResult.messages.length === 0 || isLoading) return;
    onStartTriage(parseResult.messages, inputText);
  };

  return (
    <div id="input-section" className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      {/* Intro Hero Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-800 mb-3 shadow-xs">
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <span>Operational Incident & Dispatch Assistant</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Morning Inbox Triage
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Paste 10 to 100 unread WhatsApp or email messages from drivers, customers, and vendors.
          Gemini will prioritize critical blockers, extract factual evidence, and draft responses.
        </p>
      </div>

      {/* Demo Preset Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-700">
            <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Load Demo Batches:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {DEMO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                id={`btn-preset-${preset.id}`}
                onClick={() => handleSelectPreset(preset)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
                  selectedPresetId === preset.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                }`}
                title={preset.description}
              >
                <span>{preset.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                    selectedPresetId === preset.id
                      ? 'bg-indigo-700 text-indigo-100'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {preset.badge}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Textarea Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-slate-800 flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Raw Message Batch
            </span>
            {parseResult.messages.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                {parseResult.messages.length} message{parseResult.messages.length === 1 ? '' : 's'} detected
              </span>
            )}
            {parseResult.duplicatesRemoved > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium border border-amber-200 text-[11px]">
                {parseResult.duplicatesRemoved} duplicate{parseResult.duplicatesRemoved === 1 ? '' : 's'} removed
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              id="btn-paste-clipboard"
              onClick={handlePasteClipboard}
              className="inline-flex items-center px-2 py-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 transition-colors"
              title="Paste text from clipboard"
            >
              <ClipboardPaste className="w-3.5 h-3.5 mr-1" />
              <span>Paste</span>
            </button>
            {inputText && (
              <button
                type="button"
                id="btn-clear-text"
                onClick={handleClear}
                className="inline-flex items-center px-2 py-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            id="batch-message-textarea"
            rows={12}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setSelectedPresetId('');
            }}
            placeholder={`Paste operational messages here...\n\nExample formats supported:\n• Blank line separated paragraphs\n• Numbered lines (1. Truck breakdown... 2. Delivery delay...)\n• WhatsApp chat exports ([10:14 AM] Driver Ramesh: ...)\n• Email snippets and vendor updates`}
            className="w-full p-4 font-mono text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 resize-y leading-relaxed bg-white border-0"
            disabled={isLoading}
          />
        </div>

        {/* Validation Error / Warning message */}
        {parseResult.error && inputText.trim() && (
          <div className="px-4 py-2 bg-rose-50 border-t border-rose-100 flex items-center text-xs text-rose-700">
            <AlertTriangle className="w-4 h-4 mr-1.5 shrink-0 text-rose-500" />
            <span>{parseResult.error}</span>
          </div>
        )}

        {parseResult.warning && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 flex items-center text-xs text-amber-800">
            <Info className="w-4 h-4 mr-1.5 shrink-0 text-amber-600" />
            <span>{parseResult.warning}</span>
          </div>
        )}

        {/* Footer Actions & CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3.5 bg-slate-50 border-t border-slate-200 gap-3">
          <div className="text-xs text-slate-500 flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Separates via blank lines, numbers, or timestamps</span>
          </div>

          <button
            type="submit"
            id="btn-triage-inbox"
            disabled={parseResult.messages.length === 0 || isLoading}
            className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${
              parseResult.messages.length === 0 || isLoading
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 hover:shadow-indigo-600/35 hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            <Sparkles className="w-4 h-4 mr-2 text-amber-300" />
            <span>Triage Inbox</span>
            {parseResult.messages.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-700/60 text-xs text-indigo-100">
                {parseResult.messages.length}
              </span>
            )}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </form>

      {/* Riya's Operations Checklist */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-slate-600">
        <div className="p-3 bg-white border border-slate-200 rounded-xl">
          <strong className="block text-slate-900 font-semibold mb-1">1. Priority Recall</strong>
          Vehicle breakdowns and critical blocked deliveries receive immediate priority flag with extracted evidence.
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl">
          <strong className="block text-slate-900 font-semibold mb-1">2. Vague Messages Guardrail</strong>
          Ambiguous messages (e.g. &quot;problem with delivery&quot;) are flagged for review rather than guessed.
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl">
          <strong className="block text-slate-900 font-semibold mb-1">3. Human-in-the-Loop</strong>
          Riya reviews and edits AI suggested responses before manually copying them to WhatsApp or Email.
        </div>
      </div>
    </div>
  );
};
