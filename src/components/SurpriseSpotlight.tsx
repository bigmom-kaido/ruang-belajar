import { Bookmark, Check, ExternalLink, Shuffle, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { IndexedDirectory } from '../types/directory';
import { BADGE_LABELS, externalUrl, getSectionPath } from '../utils/directory';

const CARBON_EASE = [0.2, 0, 0.38, 0.9] as const;

interface SurpriseSpotlightProps {
  resourceId: string;
  directory: IndexedDirectory;
  isBookmarked: boolean;
  isLearned: boolean;
  onToggleBookmark: (id: string) => void;
  onToggleLearned: (id: string) => void;
  onRollAgain: () => void;
  onClose: () => void;
  scopeLabel?: string;
}

export function SurpriseSpotlight({
  resourceId,
  directory,
  isBookmarked,
  isLearned,
  onToggleBookmark,
  onToggleLearned,
  onRollAgain,
  onClose,
  scopeLabel,
}: SurpriseSpotlightProps) {
  const resource = directory.resources.get(resourceId);
  if (!resource) return null;

  const firstLink = resource.links[0];
  const primaryHref = firstLink ? externalUrl(firstLink.url) : null;
  const originSections = directory.paths.get(resourceId) ?? [];
  const primaryPath = originSections[0] ? getSectionPath(originSections[0]) : [];
  const badgeMeaning =
    resource.badge &&
    (resource.badge === '⭐' || resource.badge === '🌐' || resource.badge === '↪️')
      ? BADGE_LABELS[resource.badge]
      : null;

  return (
    <motion.section
      key={resourceId}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16, ease: CARBON_EASE }}
      aria-label="Sorotan sumber belajar acak"
      className="rounded-none border border-[var(--cds-border-strong)] bg-[var(--cds-layer-01)] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--cds-border-subtle)] pb-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.78rem]">
          <span className="font-mono-tabular font-semibold tracking-[0.06em] text-[var(--cds-link-primary)] uppercase">
            Kejutan Acak
          </span>
          {scopeLabel && (
            <>
              <span aria-hidden="true" className="text-[var(--cds-text-helper)]">
                ·
              </span>
              <span className="text-[var(--cds-text-secondary)]">{scopeLabel}</span>
            </>
          )}
          {primaryPath.length > 0 && (
            <>
              <span aria-hidden="true" className="text-[var(--cds-text-helper)]">
                ·
              </span>
              <span className="text-[var(--cds-text-secondary)]">
                {primaryPath.map((node, idx) => (
                  <span key={node.href}>
                    {idx > 0 && ' / '}
                    <a
                      href={node.href}
                      className="text-[var(--cds-link-primary)] hover:underline no-underline"
                    >
                      {node.title}
                    </a>
                  </span>
                ))}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
            onClick={onRollAgain}
            className="inline-flex h-8 items-center gap-1.5 rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-02)] px-3 text-[0.78rem] font-medium text-[var(--cds-text-primary)] hover:bg-[var(--cds-layer-hover)] transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Shuffle className="h-3.5 w-3.5 text-[var(--cds-link-primary)]" />
            <span>Acak lagi</span>
          </motion.button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup sorotan acak"
            className="flex h-8 w-8 items-center justify-center rounded-none text-[var(--cds-text-helper)] hover:bg-[var(--cds-layer-hover)] hover:text-[var(--cds-text-primary)] transition-colors duration-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline gap-2">
            {primaryHref ? (
              <a
                href={primaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display inline-flex items-center gap-1.5 text-[1.3rem] font-semibold leading-snug text-[var(--cds-text-primary)] hover:text-[var(--cds-link-primary)] no-underline"
              >
                <span>{resource.title}</span>
                <ExternalLink className="h-4 w-4 shrink-0 text-[var(--cds-text-helper)]" />
              </a>
            ) : (
              <h3 className="font-display text-[1.3rem] font-semibold leading-snug text-[var(--cds-text-primary)]">
                {resource.title}
              </h3>
            )}

            {badgeMeaning && (
              <span className="text-[0.8rem] text-[var(--cds-text-secondary)]">
                {resource.badge} {badgeMeaning}
              </span>
            )}
          </div>

          {resource.description && (
            <p className="max-w-[65ch] text-[0.92rem] leading-[1.6] text-[var(--cds-text-secondary)]">
              {resource.description}
            </p>
          )}

          {resource.links.length > 1 && (
            <p className="text-[0.8rem] text-[var(--cds-text-helper)]">
              Memiliki {resource.links.length} tautan terkait di kartu sumbernya.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {primaryHref && (
            <a
              href={primaryHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-none bg-[#0f62fe] px-3.5 text-[0.82rem] font-medium text-white hover:bg-[#0353e9] transition-colors duration-100 no-underline whitespace-nowrap shrink-0"
            >
              <span>Buka sumber</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
            onClick={() => onToggleBookmark(resourceId)}
            aria-pressed={isBookmarked}
            className={`inline-flex h-9 items-center gap-1.5 rounded-none border px-3 text-[0.82rem] font-medium transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer ${
              isBookmarked
                ? 'border-[var(--cds-support-teal)] bg-[var(--cds-support-teal-soft)] text-[var(--cds-text-primary)]'
                : 'border-[var(--cds-border-subtle)] bg-[var(--cds-layer-02)] text-[var(--cds-text-secondary)] hover:bg-[var(--cds-layer-hover)] hover:text-[var(--cds-text-primary)]'
            }`}
          >
            <motion.span
              animate={{ scale: isBookmarked ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.16, ease: CARBON_EASE }}
              className="inline-flex"
            >
              <Bookmark
                className={`h-3.5 w-3.5 ${
                  isBookmarked ? 'fill-current text-[var(--cds-support-teal)]' : ''
                }`}
              />
            </motion.span>
            <span>{isBookmarked ? 'Tersimpan' : 'Simpan'}</span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
            onClick={() => onToggleLearned(resourceId)}
            aria-pressed={isLearned}
            className={`inline-flex h-9 items-center gap-1.5 rounded-none border px-3 text-[0.82rem] font-medium transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer ${
              isLearned
                ? 'border-[var(--cds-support-success)] bg-[var(--cds-support-success-soft)] text-[var(--cds-text-primary)]'
                : 'border-[var(--cds-border-subtle)] bg-[var(--cds-layer-02)] text-[var(--cds-text-secondary)] hover:bg-[var(--cds-layer-hover)] hover:text-[var(--cds-text-primary)]'
            }`}
          >
            <motion.span
              animate={{ scale: isLearned ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.16, ease: CARBON_EASE }}
              className="inline-flex"
            >
              <Check
                className={`h-3.5 w-3.5 ${
                  isLearned ? 'text-[var(--cds-support-success)]' : ''
                }`}
              />
            </motion.span>
            <span>{isLearned ? 'Sudah dipelajari' : 'Tandai selesai'}</span>
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}
