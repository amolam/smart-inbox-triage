import React from 'react';
import {
  Search,
  X,
  Filter,
  ArrowUpDown,
  Tag,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { FilterState, MessageCategory, PriorityLevel, SortMode } from '../types';

interface MessageFilterBarProps {
  filter: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  totalFiltered: number;
  totalMessages: number;
  availableCategories: { category: MessageCategory; count: number }[];
}

const CATEGORY_LABELS: Record<MessageCategory, string> = {
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

export const MessageFilterBar: React.FC<MessageFilterBarProps> = ({
  filter,
  onFilterChange,
  sortMode,
  onSortChange,
  totalFiltered,
  totalMessages,
  availableCategories,
}) => {
  const priorityTabs: { id: PriorityLevel | 'all'; label: string; dotColor?: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'critical', label: 'Critical', dotColor: 'bg-rose-500' },
    { id: 'high', label: 'High', dotColor: 'bg-amber-500' },
    { id: 'medium', label: 'Medium', dotColor: 'bg-blue-500' },
    { id: 'needs_review', label: 'Needs Review', dotColor: 'bg-purple-500' },
    { id: 'low', label: 'Low', dotColor: 'bg-emerald-500' },
  ];

  return (
    <div id="message-filter-bar" className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 mb-4 shadow-xs space-y-3">
      {/* Row 1: Search & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-messages"
            type="text"
            value={filter.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search keywords, driver names, vehicle IDs, orders, or reasons..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
          {filter.searchQuery && (
            <button
              type="button"
              id="btn-clear-search"
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category & Status Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Selector */}
          <div className="relative">
            <select
              id="select-category-filter"
              value={filter.category}
              onChange={(e) => onFilterChange({ category: e.target.value as any })}
              className="text-xs py-2 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">All Categories ({availableCategories.reduce((acc, c) => acc + c.count, 0)})</option>
              {availableCategories.map(({ category, count }) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category] || category} ({count})
                </option>
              ))}
            </select>
            <Tag className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Selector */}
          <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs">
            <button
              type="button"
              id="filter-status-all"
              onClick={() => onFilterChange({ status: 'all' })}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                filter.status === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              id="filter-status-pending"
              onClick={() => onFilterChange({ status: 'pending' })}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                filter.status === 'pending'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              id="filter-status-resolved"
              onClick={() => onFilterChange({ status: 'resolved' })}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                filter.status === 'resolved'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resolved
            </button>
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <select
              id="select-sort-mode"
              value={sortMode}
              onChange={(e) => onSortChange(e.target.value as SortMode)}
              className="text-xs py-2 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="priority">Sort: Urgency (Critical First)</option>
              <option value="original_order">Sort: Original Order</option>
              <option value="confidence">Sort: AI Confidence</option>
              <option value="status">Sort: Unresolved First</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Row 2: Priority Quick Tabs & Match Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {priorityTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              id={`tab-priority-${tab.id}`}
              onClick={() => onFilterChange({ priority: tab.id })}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 shrink-0 ${
                filter.priority === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.dotColor && <span className={`w-2 h-2 rounded-full ${tab.dotColor}`} />}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-between sm:justify-end space-x-2">
          <span>
            Showing <strong className="text-slate-800">{totalFiltered}</strong> of {totalMessages} messages
          </span>
          {(filter.priority !== 'all' || filter.category !== 'all' || filter.status !== 'all' || filter.searchQuery) && (
            <button
              type="button"
              id="btn-reset-filters"
              onClick={() =>
                onFilterChange({
                  priority: 'all',
                  category: 'all',
                  confidence: 'all',
                  status: 'all',
                  searchQuery: '',
                })
              }
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline ml-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
