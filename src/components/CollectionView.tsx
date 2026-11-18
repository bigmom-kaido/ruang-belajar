import { useRef, useState, type ChangeEvent } from 'react';
import { Bookmark, CheckCircle2, Download, Trash2, Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  BadgeFilter,
  IndexedDirectory,
  UserProgressSnapshot,
} from '../types/directory';
import { countLabel, formatNumber, getBadgeCounts } from '../utils/directory';
import { FilterBar } from './FilterBar';
import { ResourceGrid } from './ResourceGrid';
import { SurpriseSpotlight } from './SurpriseSpotlight';

const CARBON_EASE = [0.2, 0, 0.38, 0.9] as const;

interface CollectionViewProps {
  mode: 'bookmarks' | 'learned';
  ids: string[];
  allCollectionIds: string[];
  directory: IndexedDirectory;
  bookmarks: Set<string>;
  learned: Set<string>;
  badgeFilter: BadgeFilter;
  onBadgeChange: (next: BadgeFilter) => void;
  onResetFilters: () => void;
  onToggleBookmark: (id: string) => void;
  onToggleLearned: (id: string) => void;
  onClearCollection: () => void;
  onExportProgress: () => UserProgressSnapshot;
  onImportProgress: (rawJson: string) => { ok: boolean; message: string };
  spotlightId: string | null;
  onRollSurprise: (pool: string[]) => void;
  onCloseSpotlight: () => void;
}

export function CollectionView({
  mode,
  ids,
  allCollectionIds,
  directory,
  bookmarks,
  learned,
  badgeFilter,
  onBadgeChange,
  onResetFilters,
  onToggleBookmark,
  onToggleLearned,
  onClearCollection,
  onExportProgress,
  onImportProgress,
  spotlightId,
  onRollSurprise,
  onCloseSpotlight,
}: CollectionViewProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBookmarks = mode === 'bookmarks';
  const title = isBookmarks ? 'Sumber Tersimpan' : 'Sudah Dipelajari';
  const subtitle = isBookmarks
    ? 'Daftar bahan belajar yang kamu tandai untuk dibuka kembali nanti.'
    : 'Catatan progres materi dan tautan yang sudah selesai kamu pelajari.';

  const badgeCounts = getBadgeCounts(allCollectionIds, directory);

  const handleExport = () => {
    const snapshot = onExportProgress();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ruang-belajar-progres.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setFeedback({
      ok: true,
      text: 'Cadangan progres berhasil diunduh sebagai ruang-belajar-progres.json.',
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const result = onImportProgress(text);
      setFeedback({ ok: result.ok, text: result.message });
    } catch {
      setFeedback({ ok: false, text: 'Gagal membaca berkas JSON yang dipilih.' });
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono-tabular text-[0.74rem] font-medium tracking-[0.06em] text-[var(--cds-link-primary)] uppercase">
              {isBookmarks ? (
                <Bookmark className="h-3.5 w-3.5 text-[var(--cds-support-teal)]" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--cds-support-success)]" />
              )}
              <span>Koleksi Pribadi</span>
            </div>
            <h1 className="font-display text-[1.9rem] font-semibold leading-tight text-[var(--cds-text-primary)]">
              {title}
            </h1>
            <p className="max-w-[56ch] text-[0.92rem] text-[var(--cds-text-secondary)]">
              {subtitle}
            </p>
            <p className="font-mono-tabular text-[0.8rem] text-[var(--cds-text-helper)]">
              {countLabel(allCollectionIds.length, 'sumber')} dalam daftar ini
              {ids.length !== allCollectionIds.length &&
                ` · ${formatNumber(ids.length)} ditampilkan`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-9 items-center gap-1.5 rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-02)] px-3 text-[0.8rem] font-medium text-[var(--cds-text-primary)] hover:bg-[var(--cds-layer-hover)] transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-[var(--cds-link-primary)]" />
              <span>Ekspor JSON</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-9 items-center gap-1.5 rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-02)] px-3 text-[0.8rem] font-medium text-[var(--cds-text-primary)] hover:bg-[var(--cds-layer-hover)] transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5 text-[var(--cds-link-primary)]" />
              <span>Impor JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Pilih berkas JSON cadangan progres"
            />

            {allCollectionIds.length > 0 && !confirmClear && (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)] px-3 text-[0.8rem] font-medium text-[var(--cds-text-secondary)] hover:border-[var(--cds-support-danger)] hover:text-[var(--cds-support-danger)] transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Kosongkan</span>
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {confirmClear && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: CARBON_EASE }}
              className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-none border border-[var(--cds-support-danger)] bg-[#fff1f1] px-4 py-3 text-[0.84rem] dark:bg-[#2d1316]"
            >
              <span className="font-medium text-[var(--cds-text-primary)]">
                Hapus semua {countLabel(allCollectionIds.length, 'sumber')} dari daftar{' '}
                {isBookmarks ? 'tersimpan' : 'sudah dipelajari'}?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearCollection();
                    setConfirmClear(false);
                    setFeedback({
                      ok: true,
                      text: 'Daftar berhasil dikosongkan.',
                    });
                  }}
                  className="rounded-none bg-[#da1e28] px-3 py-1.5 text-[0.8rem] font-medium text-white hover:bg-[#ba1b23] transition-colors duration-100 cursor-pointer"
                >
                  Ya, hapus semua
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="rounded-none border border-[var(--cds-border-strong)] bg-[var(--cds-layer-01)] px-3 py-1.5 text-[0.8rem] font-medium text-[var(--cds-text-primary)] hover:bg-[var(--cds-layer-hover)] transition-colors duration-100 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {feedback && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: CARBON_EASE }}
              className={`mt-4 flex items-center justify-between gap-2 rounded-none border px-3.5 py-2.5 text-[0.82rem] ${
                feedback.ok
                  ? 'border-[var(--cds-support-success)] bg-[var(--cds-support-success-soft)] text-[var(--cds-text-primary)]'
                  : 'border-[var(--cds-support-danger)] bg-[#fff1f1] text-[var(--cds-text-primary)] dark:bg-[#2d1316]'
              }`}
            >
              <span>{feedback.text}</span>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-[0.76rem] font-medium text-[var(--cds-text-secondary)] hover:text-[var(--cds-text-primary)] cursor-pointer"
              >
                Tutup
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {allCollectionIds.length > 0 ? (
        <>
          <FilterBar
            badgeFilter={badgeFilter}
            statusFilter="all"
            onBadgeChange={onBadgeChange}
            onStatusChange={() => {}}
            badgeCounts={badgeCounts}
            filteredCount={ids.length}
            onReset={onResetFilters}
            onSurprise={() => onRollSurprise(ids)}
            hideStatusFilter
          />

          <AnimatePresence mode="wait">
            {spotlightId && (
              <SurpriseSpotlight
                resourceId={spotlightId}
                directory={directory}
                isBookmarked={bookmarks.has(spotlightId)}
                isLearned={learned.has(spotlightId)}
                onToggleBookmark={onToggleBookmark}
                onToggleLearned={onToggleLearned}
                onRollAgain={() => onRollSurprise(ids)}
                onClose={onCloseSpotlight}
                scopeLabel={title}
              />
            )}
          </AnimatePresence>

          <ResourceGrid
            ids={ids}
            directory={directory}
            bookmarks={bookmarks}
            learned={learned}
            onToggleBookmark={onToggleBookmark}
            onToggleLearned={onToggleLearned}
            showPaths
            onResetFilters={badgeFilter !== 'all' ? onResetFilters : undefined}
          />
        </>
      ) : (
        <div className="rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)] p-10 text-center">
          <h2 className="font-display text-[1.25rem] font-semibold text-[var(--cds-text-primary)]">
            {isBookmarks
              ? 'Belum ada sumber tersimpan'
              : 'Belum ada sumber yang ditandai selesai'}
          </h2>
          <p className="mx-auto mt-2 max-w-[46ch] text-[0.9rem] text-[var(--cds-text-secondary)]">
            {isBookmarks
              ? 'Klik tombol Simpan pada kartu mana pun untuk mengumpulkan bahan belajar pilihanmu di sini.'
              : 'Tandai sumber yang sudah kamu pelajari agar progres belajarmu tercatat rapi.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a
              href="#/"
              className="inline-flex h-10 items-center rounded-none bg-[#0f62fe] px-4 text-[0.84rem] font-medium text-white hover:bg-[#0353e9] no-underline"
            >
              Jelajahi topik
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
