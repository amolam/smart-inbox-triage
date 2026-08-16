import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle,
  HelpCircle,
  Download,
  CheckCheck,
  Percent,
} from 'lucide-react';
import { BatchSummary, PriorityLevel } from '../types';

interface DashboardSummaryProps {
  summary: BatchSummary;
  activePriorityFilter: PriorityLevel | 'all';
  onSelectPriorityFilter: (priority: PriorityLevel | 'all') => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onMarkAllLowResolved: () => void;
  batchTimestamp?: string;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  summary,
  activePriorityFilter,
  onSelectPriorityFilter,
  onExportJson,
  onExportCsv,
  onMarkAllLowResolved,
  batchTimestamp,
}) => {
  const total = summary.total_messages || 1;
  const resolved = summary.resolved_count || 0;
  const resolvedPercent = Math.round((resolved / total) * 100);

  const cards = [
    {
      id: 'critical' as PriorityLevel,
      label: 'Critical',
      count: summary.critical_count,
      percent: Math.round((summary.critical_count / total) * 100),
      icon: AlertCircle,
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-300',
      activeRing: 'ring-2 ring-rose-500 bg-rose-100/70',
      badgeBg: 'bg-rose-600 text-white',
      desc: 'Immediate operational blocker',
    },
    {
      id: 'high' as PriorityLevel,
      label: 'High',
      count: summary.high_count,
      percent: Math.round((summary.high_count / total) * 100),
      icon: AlertTriangle,
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300',
      activeRing: 'ring-2 ring-amber-500 bg-amber-100/70',
      badgeBg: 'bg-amber-500 text-white',
      desc: 'Significant issue requiring action soon',
    },
    {
      id: 'medium' as PriorityLevel,
      label: 'Medium',
      count: summary.medium_count,
      percent: Math.round((summary.medium_count / total) * 100),
      icon: Clock,
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      activeRing: 'ring-2 ring-blue-500 bg-blue-100/70',
      badgeBg: 'bg-blue-600 text-white',
      desc: 'Action required, no immediate blocker',
    },
    {
      id: 'needs_review' as PriorityLevel,
      label: 'Needs Review',
      count: summary.needs_review_count,
      percent: Math.round((summary.needs_review_count / total) * 100),
      icon: HelpCircle,
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300',
      activeRing: 'ring-2 ring-purple-500 bg-purple-100/70',
      badgeBg: 'bg-purple-600 text-white',
      desc: 'Vague or ambiguous message',
    },
    {
      id: 'low' as PriorityLevel,
      label: 'Low',
      count: summary.low_count,
      percent: Math.round((summary.low_count / total) * 100),
      icon: CheckCircle,
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-300',
      activeRing: 'ring-2 ring-emerald-500 bg-emerald-100/70',
      badgeBg: 'bg-emerald-600 text-white',
      desc: 'Informational or confirmed',
    },
  ];

  return (
    <div id="dashboard-summary" className="mb-6 space-y-4">
      {/* Top Banner with Stats & Progress */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900">
                Triage Overview
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {summary.total_messages} Messages
              </span>
            </div>
            {batchTimestamp && (
              <p className="text-xs text-slate-500 mt-1">
                Processed at {new Date(batchTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Stored locally in browser
              </p>
            )}
          </div>

          {/* Resolution Tracker & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 flex items-center space-x-3 min-w-[200px]">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Resolved</span>
                  <span>{resolved} / {summary.total_messages} ({resolvedPercent}%)</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${resolvedPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {summary.low_count > 0 && (
              <button
                type="button"
                id="btn-mark-low-resolved"
                onClick={onMarkAllLowResolved}
                className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs"
                title="Mark all Low informational messages as resolved"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                <span>Resolve All Low ({summary.low_count})</span>
              </button>
            )}

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                id="btn-export-csv"
                onClick={onExportCsv}
                className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors shadow-2xs"
                title="Download CSV export for dispatch handover"
              >
                <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                <span>CSV</span>
              </button>

              <button
                type="button"
                id="btn-export-json"
                onClick={onExportJson}
                className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors shadow-2xs"
                title="Download JSON structured export"
              >
                <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const isSelected = activePriorityFilter === card.id;

          return (
            <button
              key={card.id}
              type="button"
              id={`stat-card-${card.id}`}
              onClick={() => onSelectPriorityFilter(isSelected ? 'all' : card.id)}
              className={`text-left p-3.5 rounded-2xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                card.bgColor
              } ${card.borderColor} ${
                isSelected
                  ? `${card.activeRing} shadow-md`
                  : 'hover:shadow-sm hover:-translate-y-0.5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center text-xs font-bold ${card.textColor}`}>
                  <Icon className="w-4 h-4 mr-1.5 shrink-0" />
                  {card.label}
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {card.percent}%
                </span>
              </div>

              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {card.count}
                </span>
                <span className="text-[11px] text-slate-500 truncate">
                  message{card.count === 1 ? '' : 's'}
                </span>
              </div>

              <div className="mt-2 text-[10px] text-slate-500 truncate">
                {card.desc}
              </div>

              {isSelected && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-indigo-600 rounded-bl-lg" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
