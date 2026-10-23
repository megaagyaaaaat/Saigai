import React, { useState } from 'react';
import type { IncidentRecord } from '../../features/incidents/incident.types';
import { formatDate } from '../../lib/date';
import { Calendar, Truck, Search } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface IncidentTimelineProps {
  incidents: IncidentRecord[];
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ incidents }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const filtered = incidents.filter((inc) => {
    if (filterSeverity !== 'all' && inc.severity !== filterSeverity) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.damageDescription.toLowerCase().includes(q) ||
        (inc.highwayAffected && inc.highwayAffected.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-ner-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search records, highways..."
            className="w-full bg-[#18181b] border border-ner-border rounded-lg pl-8 pr-3 py-1 text-xs text-ner-text placeholder-ner-muted/60 ner-focus"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'catastrophic', 'severe', 'moderate'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-mono capitalize transition-colors ${
                filterSeverity === sev
                  ? 'bg-ner-cyan text-ner-bg font-bold'
                  : 'bg-ner-surface border border-ner-border text-ner-muted hover:text-ner-text'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-ner-muted text-xs font-mono bg-[#18181b] rounded-xl border border-ner-border/40">
          No historical landslide events match the criteria for this region.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-ner-border">
          {filtered.map((inc) => (
            <div
              key={inc.id}
              className="relative bg-[#18181b] rounded-xl p-3.5 border border-ner-border hover:border-ner-cyan/40 transition-colors group"
            >
              {/* Timeline marker node */}
              <span
                className={`absolute -left-[1.85rem] top-4 w-3 h-3 rounded-full border-2 border-ner-panel ${
                  inc.severity === 'catastrophic'
                    ? 'bg-ner-red'
                    : inc.severity === 'severe'
                    ? 'bg-ner-orange'
                    : 'bg-ner-amber'
                }`}
              />

              <div className="flex items-start justify-between gap-2 mb-1">
                <h5 className="font-semibold text-xs text-ner-text group-hover:text-ner-cyan transition-colors">
                  {inc.title}
                </h5>
                <Badge level={inc.severity as any} size="sm" />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-ner-muted mb-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-ner-cyan" />
                  {formatDate(inc.date)}
                </span>
                <span>•</span>
                <span className="capitalize">{inc.trigger.replace('_', ' ')}</span>
                {inc.casualties > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-ner-red font-bold">
                      {inc.casualties} {inc.casualties === 1 ? 'casualty' : 'casualties'}
                    </span>
                  </>
                )}
              </div>

              <p className="text-xs text-ner-muted leading-relaxed mb-2">
                {inc.damageDescription}
              </p>

              {inc.highwayAffected && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-ner-cyan bg-ner-panel/60 px-2 py-1 rounded border border-ner-border/40">
                  <Truck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{inc.highwayAffected}</span>
                </div>
              )}

              <div className="mt-2 pt-2 border-t border-ner-border/30 text-[10px] font-mono text-ner-muted flex justify-between items-center">
                <span>Source: {inc.dataSource}</span>
                <span className="text-ner-emerald">✓ Verified Record</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
