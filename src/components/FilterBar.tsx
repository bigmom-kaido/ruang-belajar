import { RotateCcw, Shuffle } from 'lucide-react';
import type { BadgeFilter, StatusFilter } from '../types/directory';
import { formatNumber } from '../utils/directory';

interface FilterBarProps {
  badgeFilter: BadgeFilter;
  statusFilter: StatusFilter;
  onBadgeChange: (next: BadgeFilter) => void;
  onStatusChange: (next: StatusFilter) => void;
  badgeCounts: Record<BadgeFilter, number>;
  filteredCount: number;
  onReset: () => void;
  onSurprise?: () => void;
  hideStatusFilter?: boolean;
}

const BADGE_OPTIONS: Array<{ value: BadgeFilter; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: '⭐', label: '⭐ Pilihan Wiki' },
  { value: '🌐', label: '🌐 Kumpulan Tautan' },
  { value: '↪️', label: '↪️ Rujukan Silang' },
];

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Semua Status' },
  { value: 'unlearned', label: 'Belum dipelajari' },
  { value: 'bookmarked', label: 'Tersimpan' },
  { value: 'learned', label: 'Selesai' },
];

export function FilterBar({
  badgeFilter,
  statusFilter,
  onBadgeChange,
  onStatusChange,
  badgeCounts,
  filteredCount,
  onReset,
  onSurprise,
  hideStatusFilter = false,
}: FilterBarProps) {
  const isFiltered = badgeFilter !== 'all' || (!hideStatusFilter && statusFilter !== 'all');

  return (
    <div className="flex flex-col gap-3 rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Carbon Content Switcher rail */}
        <div
          role="group"
          aria-label="Filter jenis kurasi"
          className="inline-flex flex-wrap border border-[var(--cds-border-strong)]"
        >
          {BADGE_OPTIONS.map((option, idx) => {
            const active = badgeFilter === option.value;
            const count = badgeCounts[option.value];
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => onBadgeChange(option.value)}
                className={`inline-flex h-9 items-center gap-2 rounded-none px-3 text-[0.8rem] font-medium transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer ${
                  idx > 0 ? 'border-l border-[var(--cds-border-subtle)]' : ''
                } ${
                  active
                    ? 'bg-[#161616] text-[#f4f4f4] dark:bg-[#f4f4f4] dark:text-[#161616]'
                    : 'bg-[var(--cds-layer-01)] text-[var(--cds-text-secondary)] hover:bg-[var(--cds-layer-hover)] hover:text-[var(--cds-text-primary)]'
                }`}
              >
                <span>{option.label}</span>
                <span
                  className={`font-mono-tabular text-[0.72rem] ${
                    active
                      ? 'text-[#c6c6c6] dark:text-[#525252]'
                      : 'text-[var(--cds-text-helper)]'
                  }`}
                >
                  {formatNumber(count)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSurprise && filteredCount > 0 && (
            <button
              type="button"
              onClick={onSurprise}
              className="inline-flex h-9 items-center gap-1.5 rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-02)] px-3 text-[0.8rem] font-medium text-[var(--cds-text-primary)] hover:bg-[var(--cds-layer-hover)] transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Shuffle className="h-3.5 w-3.5 text-[var(--cds-link-primary)]" />
              <span>Acak di daftar ini</span>
            </button>
          )}

          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-9 items-center gap-1.5 rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)] px-3 text-[0.8rem] font-medium text-[var(--cds-text-secondary)] hover:bg-[var(--cds-layer-hover)] hover:text-[var(--cds-text-primary)] transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset filter</span>
            </button>
          )}
        </div>
      </div>

      {!hideStatusFilter && (
        <div
          role="group"
          aria-label="Filter status belajar"
          className="flex flex-wrap items-center gap-1.5 border-t border-[var(--cds-border-subtle)] pt-3"
        >
          <span className="mr-1 font-mono-tabular text-[0.72rem] font-medium tracking-[0.04em] text-[var(--cds-text-helper)] uppercase">
            Status:
          </span>
          {STATUS_OPTIONS.map((option) => {
            const active = statusFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => onStatusChange(option.value)}
                className={`inline-flex h-8 items-center rounded-none border px-2.5 text-[0.78rem] font-medium transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'border-[var(--cds-interactive)] bg-[#edf5ff] text-[#0043ce] dark:bg-[#002d9c]/45 dark:text-[#a6c8ff]'
                    : 'border-transparent bg-transparent text-[var(--cds-text-secondary)] hover:bg-[var(--cds-layer-hover)] hover:text-[var(--cds-text-primary)]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
