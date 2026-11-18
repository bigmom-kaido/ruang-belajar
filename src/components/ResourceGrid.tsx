import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import type { IndexedDirectory } from '../types/directory';
import { countLabel } from '../utils/directory';
import { ResourceCard } from './ResourceCard';

const PAGE_SIZE = 48;
const CARBON_EASE = [0.2, 0, 0.38, 0.9] as const;

interface ResourceGridProps {
  ids: string[];
  directory: IndexedDirectory;
  bookmarks: Set<string>;
  learned: Set<string>;
  onToggleBookmark: (id: string) => void;
  onToggleLearned: (id: string) => void;
  showPaths?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  onResetFilters?: () => void;
}

export function ResourceGrid({
  ids,
  directory,
  bookmarks,
  learned,
  onToggleBookmark,
  onToggleLearned,
  showPaths = false,
  emptyTitle = 'Tidak ada sumber yang cocok',
  emptyMessage = 'Coba ubah filter atau kata kunci pencarian.',
  onResetFilters,
}: ResourceGridProps) {
  const [shownCount, setShownCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setShownCount(PAGE_SIZE);
  }, [ids]);

  if (ids.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: CARBON_EASE }}
        className="rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)] p-8 text-center"
      >
        <h3 className="font-display text-[1.18rem] font-semibold text-[var(--cds-text-primary)]">
          {emptyTitle}
        </h3>
        <p className="mx-auto mt-1.5 max-w-[46ch] text-[0.9rem] text-[var(--cds-text-secondary)]">
          {emptyMessage}
        </p>
        {onResetFilters && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.1 }}
            onClick={onResetFilters}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-none border border-[var(--cds-border-strong)] bg-[var(--cds-layer-02)] px-4 text-[0.84rem] font-medium text-[var(--cds-text-primary)] hover:bg-[var(--cds-layer-hover)] transition-colors duration-100 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset filter</span>
          </motion.button>
        )}
      </motion.div>
    );
  }

  const visibleIds = ids.slice(0, shownCount);
  const remaining = ids.length - visibleIds.length;
  const gridSignature = `${ids.length}-${ids[0] ?? ''}`;

  return (
    <div className="space-y-5">
      <motion.div
        key={gridSignature}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: CARBON_EASE }}
        className="grid gap-4 md:grid-cols-2"
      >
        {visibleIds.map((id) => {
          const resource = directory.resources.get(id);
          if (!resource) return null;
          return (
            <ResourceCard
              key={id}
              id={id}
              resource={resource}
              directory={directory}
              isBookmarked={bookmarks.has(id)}
              isLearned={learned.has(id)}
              onToggleBookmark={onToggleBookmark}
              onToggleLearned={onToggleLearned}
              showPaths={showPaths}
            />
          );
        })}
      </motion.div>

      {remaining > 0 && (
        <div className="flex justify-center pt-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.1 }}
            onClick={() => setShownCount((prev) => prev + PAGE_SIZE)}
            className="inline-flex h-10 items-center gap-2 rounded-none border border-[var(--cds-border-strong)] bg-[var(--cds-layer-01)] px-5 text-[0.86rem] font-medium text-[var(--cds-text-primary)] hover:bg-[var(--cds-layer-hover)] transition-colors duration-100 cursor-pointer"
          >
            <span>Tampilkan {countLabel(Math.min(remaining, PAGE_SIZE), 'sumber')} lagi</span>
            <span className="font-mono-tabular text-[0.78rem] text-[var(--cds-text-helper)]">
              ({countLabel(remaining, 'tersisa')})
            </span>
          </motion.button>
        </div>
      )}
    </div>
  );
}
