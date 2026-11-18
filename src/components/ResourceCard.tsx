import { Bookmark, Check, ChevronDown, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import type { IndexedDirectory, RawResource } from '../types/directory';
import {
  BADGE_LABELS,
  countLabel,
  externalUrl,
  getSectionPath,
} from '../utils/directory';

const CARBON_EASE = [0.2, 0, 0.38, 0.9] as const;

interface ResourceCardProps {
  id: string;
  resource: RawResource;
  directory: IndexedDirectory;
  isBookmarked: boolean;
  isLearned: boolean;
  onToggleBookmark: (id: string) => void;
  onToggleLearned: (id: string) => void;
  showPaths?: boolean;
}

export function ResourceCard({
  id,
  resource,
  directory,
  isBookmarked,
  isLearned,
  onToggleBookmark,
  onToggleLearned,
  showPaths = false,
}: ResourceCardProps) {
  const firstLink = resource.links[0];
  const headingIsLink =
    Boolean(firstLink) &&
    firstLink.label === resource.title &&
    resource.type !== 'note';
  const headingHref = headingIsLink ? externalUrl(firstLink.url) : null;
  const extraLinks = headingIsLink ? resource.links.slice(1) : resource.links;

  const badgeMeaning =
    resource.badge === '⭐' || resource.badge === '🌐' || resource.badge === '↪️'
      ? BADGE_LABELS[resource.badge]
      : null;

  const originSections = showPaths ? (directory.paths.get(id) ?? []) : [];

  return (
    <article
      className={`flex flex-col justify-between gap-4 rounded-none border p-5 transition-colors duration-150 ${
        isLearned
          ? 'border-[var(--cds-support-success)]/55 bg-[var(--cds-layer-01)]'
          : 'border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)] hover:border-[var(--cds-border-strong)]'
      }`}
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            {headingIsLink && headingHref ? (
              <h3 className="text-[1.02rem] font-semibold leading-snug text-[var(--cds-text-primary)]">
                <a
                  href={headingHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-baseline gap-1.5 text-[var(--cds-text-primary)] hover:text-[var(--cds-link-primary)] no-underline transition-colors duration-100"
                >
                  <span className="break-words">{resource.title}</span>
                  <ExternalLink
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 translate-y-[1px] text-[var(--cds-text-helper)] transition-transform duration-150 group-hover:translate-x-[1px] group-hover:-translate-y-[1px] group-hover:text-[var(--cds-link-primary)]"
                  />
                </a>
              </h3>
            ) : (
              <h3 className="text-[1.02rem] font-semibold leading-snug text-[var(--cds-text-primary)] break-words">
                {resource.title}
              </h3>
            )}

            {badgeMeaning && (
              <p className="text-[0.78rem] text-[var(--cds-text-helper)]">
                <span aria-hidden="true">{resource.badge}</span> {badgeMeaning}
              </p>
            )}
          </div>
        </div>

        {(resource.description || resource.text) && (
          <p className="text-[0.89rem] leading-[1.58] text-[var(--cds-text-secondary)] break-words">
            {resource.description || resource.text}
          </p>
        )}

        {extraLinks.length > 0 && (
          <details className="group rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-02)] px-3 py-2 text-[0.82rem]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-medium text-[var(--cds-text-primary)] select-none [&::-webkit-details-marker]:hidden">
              <span>
                {headingIsLink
                  ? countLabel(extraLinks.length, 'tautan terkait')
                  : countLabel(extraLinks.length, 'tautan')}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[var(--cds-text-helper)] transition-transform duration-150 group-open:rotate-180" />
            </summary>
            <ul className="mt-2 space-y-1.5 border-t border-[var(--cds-border-subtle)] pt-2">
              {extraLinks.map((item, idx) => {
                const href = externalUrl(item.url);
                return (
                  <li
                    key={`${item.url}-${idx}`}
                    className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[0.82rem] leading-snug text-[var(--cds-text-secondary)]"
                  >
                    {item.prefix && (
                      <span className="text-[var(--cds-text-helper)]">{item.prefix}</span>
                    )}
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-baseline gap-1 font-medium text-[var(--cds-link-primary)] hover:underline no-underline break-all"
                      >
                        <span>{item.label}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 translate-y-[1px]" />
                      </a>
                    ) : (
                      <span>{item.label}</span>
                    )}
                    {item.annotation && (
                      <span className="text-[var(--cds-text-helper)]">{item.annotation}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </details>
        )}

        {showPaths && originSections.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5 text-[0.76rem] text-[var(--cds-text-helper)]">
            <span>Topik:</span>
            {originSections.map((section, idx) => {
              const label = getSectionPath(section)
                .map((node) => node.title)
                .join(' / ');
              return (
                <span key={section.href} className="inline-flex items-center gap-2">
                  {idx > 0 && <span aria-hidden="true">·</span>}
                  <a
                    href={section.href}
                    className="text-[var(--cds-link-primary)] hover:underline no-underline"
                  >
                    {label}
                  </a>
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--cds-border-subtle)] pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
            onClick={() => onToggleBookmark(id)}
            aria-pressed={isBookmarked}
            className={`inline-flex h-8 items-center gap-1.5 rounded-none border px-2.5 text-[0.78rem] font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
              isBookmarked
                ? 'border-[var(--cds-support-teal)] bg-[var(--cds-support-teal-soft)] text-[var(--cds-text-primary)]'
                : 'border-[var(--cds-border-subtle)] bg-[var(--cds-layer-02)] text-[var(--cds-text-secondary)] hover:bg-[var(--cds-layer-hover)] hover:text-[var(--cds-text-primary)]'
            }`}
          >
            <motion.span
              animate={{ scale: isBookmarked ? [1, 1.22, 1] : 1 }}
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
            onClick={() => onToggleLearned(id)}
            aria-pressed={isLearned}
            className={`inline-flex h-8 items-center gap-1.5 rounded-none border px-2.5 text-[0.78rem] font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
              isLearned
                ? 'border-[var(--cds-support-success)] bg-[var(--cds-support-success-soft)] text-[var(--cds-text-primary)]'
                : 'border-[var(--cds-border-subtle)] bg-[var(--cds-layer-02)] text-[var(--cds-text-secondary)] hover:bg-[var(--cds-layer-hover)] hover:text-[var(--cds-text-primary)]'
            }`}
          >
            <motion.span
              animate={{ scale: isLearned ? [1, 1.22, 1] : 1 }}
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

        {isLearned && (
          <motion.span
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15, ease: CARBON_EASE }}
            className="font-mono-tabular text-[0.72rem] font-medium text-[var(--cds-support-success)]"
          >
            Selesai
          </motion.span>
        )}
      </div>
    </article>
  );
}
