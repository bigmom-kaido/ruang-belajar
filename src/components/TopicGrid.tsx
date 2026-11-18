import { ArrowUpRight, BookOpen, Compass, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import type { SectionNode } from '../types/directory';
import { countLabel, formatNumber } from '../utils/directory';

const CARBON_EASE = [0.2, 0, 0.38, 0.9] as const;

interface TopicGridProps {
  sections: SectionNode[];
  learned: Set<string>;
}

const ACCENT_STYLES = [
  'bg-[#edf5ff] text-[#0f62fe] dark:bg-[#002d9c]/50 dark:text-[#78a9ff]',
  'bg-[#d9fbfb] text-[#007d79] dark:bg-[#004144] dark:text-[#08bdba]',
  'bg-[#f6f2ff] text-[#6929c4] dark:bg-[#31135e] dark:text-[#be95ff]',
];

const TOPIC_ICONS = [BookOpen, Layers, Compass];

export function TopicGrid({ sections, learned }: TopicGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {sections.map((section, idx) => {
        const total = section.total.size;
        let doneCount = 0;
        for (const id of section.total) {
          if (learned.has(id)) doneCount++;
        }
        const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
        const Icon = TOPIC_ICONS[idx % TOPIC_ICONS.length];
        const accentClass = ACCENT_STYLES[idx % ACCENT_STYLES.length];

        return (
          <motion.a
            key={section.href}
            href={section.href}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.99 }}
            transition={{
              duration: 0.16,
              delay: Math.min(idx * 0.014, 0.14),
              ease: CARBON_EASE,
            }}
            className="group flex flex-col justify-between gap-4 rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)] p-5 no-underline transition-colors duration-150 hover:border-[var(--cds-interactive)] hover:bg-[var(--cds-layer-hover)]/45"
          >
            <div className="flex items-start justify-between gap-3">
              <div
                aria-hidden="true"
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-none ${accentClass}`}
              >
                <Icon className="h-4 w-4" />
              </div>

              <ArrowUpRight
                aria-hidden="true"
                className="h-4 w-4 text-[var(--cds-text-helper)] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--cds-link-primary)]"
              />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display text-[1.12rem] font-semibold leading-snug text-[var(--cds-text-primary)] group-hover:text-[var(--cds-link-primary)] transition-colors duration-150">
                {section.title}
              </h3>

              <p className="text-[0.82rem] text-[var(--cds-text-secondary)]">
                <span>{countLabel(total, 'sumber')}</span>
                {section.children.length > 0 && (
                  <span> · {countLabel(section.children.length, 'subtopik')}</span>
                )}
              </p>
            </div>

            <div className="space-y-1.5 border-t border-[var(--cds-border-subtle)] pt-3">
              <div className="flex items-center justify-between text-[0.76rem]">
                <span className="text-[var(--cds-text-helper)]">Dipelajari</span>
                <span className="font-mono-tabular text-[var(--cds-text-primary)]">
                  {formatNumber(doneCount)}/{formatNumber(total)}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-none bg-[var(--cds-layer-02)]">
                <div
                  className="h-full rounded-none bg-[#0f62fe] transition-all duration-300 dark:bg-[#4589ff]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </motion.a>
        );
      })}
    </div>
  );
}
