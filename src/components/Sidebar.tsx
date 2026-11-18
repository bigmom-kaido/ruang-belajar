import { useEffect, useState } from 'react';
import { Bookmark, CheckCircle2, ChevronRight, Compass, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { RouteState, SectionNode } from '../types/directory';
import { formatNumber } from '../utils/directory';

const CARBON_EASE = [0.2, 0, 0.38, 0.9] as const;

interface SidebarProps {
  sections: SectionNode[];
  route: RouteState;
  bookmarksCount: number;
  learnedCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function getAncestorHrefs(route: RouteState): Set<string> {
  const set = new Set<string>();
  if (route.type !== 'section') return set;
  let current: SectionNode | null = route.section;
  while (current) {
    set.add(current.href);
    current = current.parent;
  }
  return set;
}

interface TreeNodeProps {
  node: SectionNode;
  depth: number;
  activeHref: string | null;
  expandedMap: Record<string, boolean>;
  ancestorHrefs: Set<string>;
  onToggleExpand: (href: string, currentlyExpanded: boolean) => void;
  onNavigate: () => void;
}

function TreeNode({
  node,
  depth,
  activeHref,
  expandedMap,
  ancestorHrefs,
  onToggleExpand,
  onNavigate,
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const isCurrent = activeHref === node.href;
  const isExpanded =
    hasChildren &&
    (expandedMap[node.href] !== undefined
      ? expandedMap[node.href]
      : ancestorHrefs.has(node.href));
  const subListId = `sub-${node.href.replace(/[^a-z0-9]/gi, '-')}`;

  return (
    <li>
      <div
        className={`group flex items-center justify-between gap-1 rounded-none pr-2 transition-colors duration-100 ${
          isCurrent
            ? 'bg-[var(--cds-layer-selected)] text-[var(--cds-text-primary)] font-semibold'
            : 'text-[var(--cds-text-secondary)] hover:bg-[var(--cds-layer-hover)] hover:text-[var(--cds-text-primary)]'
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {hasChildren ? (
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={subListId}
              aria-label={`${isExpanded ? 'Tutup' : 'Buka'} subtopik ${node.title}`}
              onClick={() => onToggleExpand(node.href, isExpanded)}
              className="flex h-7 w-5 shrink-0 items-center justify-center rounded-none text-[var(--cds-text-helper)] hover:text-[var(--cds-text-primary)] cursor-pointer"
            >
              <ChevronRight
                className={`h-3.5 w-3.5 transition-transform duration-150 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>
          ) : (
            <span className="w-5 shrink-0" aria-hidden="true" />
          )}

          <a
            href={node.href}
            aria-current={isCurrent ? 'page' : undefined}
            onClick={onNavigate}
            className="flex-1 truncate py-2 text-[0.85rem] leading-snug no-underline text-inherit"
          >
            {node.title}
          </a>
        </div>

        <span className="font-mono-tabular text-[0.72rem] text-[var(--cds-text-helper)] shrink-0 pl-1">
          {formatNumber(node.total.size)}
        </span>
      </div>

      <AnimatePresence initial={false}>
        {hasChildren && isExpanded && (
          <motion.ul
            id={subListId}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: CARBON_EASE }}
            className="space-y-0"
          >
            {node.children.map((child) => (
              <TreeNode
                key={child.href}
                node={child}
                depth={depth + 1}
                activeHref={activeHref}
                expandedMap={expandedMap}
                ancestorHrefs={ancestorHrefs}
                onToggleExpand={onToggleExpand}
                onNavigate={onNavigate}
              />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

export function Sidebar({
  sections,
  route,
  bookmarksCount,
  learnedCount,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const ancestorHrefs = getAncestorHrefs(route);
  const activeHref = route.type === 'section' ? route.section.href : null;

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileOpen, onCloseMobile]);

  const handleToggleExpand = (href: string, currentlyExpanded: boolean) => {
    setExpandedMap((prev) => ({ ...prev, [href]: !currentlyExpanded }));
  };

  const navContent = (onNavigate: () => void) => (
    <div className="flex flex-col py-3">
      <div className="space-y-0 px-2">
        <a
          href="#/"
          onClick={onNavigate}
          aria-current={route.type === 'home' ? 'page' : undefined}
          className={`flex items-center justify-between rounded-none px-3 py-2.5 text-[0.86rem] no-underline transition-colors duration-100 ${
            route.type === 'home'
              ? 'bg-[var(--cds-layer-selected)] font-semibold text-[var(--cds-text-primary)]'
              : 'text-[var(--cds-text-secondary)] hover:bg-[var(--cds-layer-hover)] hover:text-[var(--cds-text-primary)]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Compass className="h-4 w-4 text-[var(--cds-link-primary)]" />
            <span>Ikhtisar</span>
          </span>
        </a>

        <a
          href="#/tersimpan"
          onClick={onNavigate}
          aria-current={route.type === 'bookmarks' ? 'page' : undefined}
          className={`flex items-center justify-between rounded-none px-3 py-2.5 text-[0.86rem] no-underline transition-colors duration-100 ${
            route.type === 'bookmarks'
              ? 'bg-[var(--cds-layer-selected)] font-semibold text-[var(--cds-text-primary)]'
              : 'text-[var(--cds-text-secondary)] hover:bg-[var(--cds-layer-hover)] hover:text-[var(--cds-text-primary)]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Bookmark className="h-4 w-4 text-[var(--cds-support-teal)]" />
            <span>Tersimpan</span>
          </span>
          <span className="font-mono-tabular text-[0.75rem] text-[var(--cds-text-helper)]">
            {formatNumber(bookmarksCount)}
          </span>
        </a>

        <a
          href="#/dipelajari"
          onClick={onNavigate}
          aria-current={route.type === 'learned' ? 'page' : undefined}
          className={`flex items-center justify-between rounded-none px-3 py-2.5 text-[0.86rem] no-underline transition-colors duration-100 ${
            route.type === 'learned'
              ? 'bg-[var(--cds-layer-selected)] font-semibold text-[var(--cds-text-primary)]'
              : 'text-[var(--cds-text-secondary)] hover:bg-[var(--cds-layer-hover)] hover:text-[var(--cds-text-primary)]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-[var(--cds-support-success)]" />
            <span>Sudah Dipelajari</span>
          </span>
          <span className="font-mono-tabular text-[0.75rem] text-[var(--cds-text-helper)]">
            {formatNumber(learnedCount)}
          </span>
        </a>
      </div>

      <div className="mt-3 border-t border-[var(--cds-border-subtle)] pt-3">
        <div className="mb-1.5 px-5 font-mono-tabular text-[0.68rem] font-semibold tracking-[0.08em] text-[var(--cds-text-helper)] uppercase">
          Indeks Topik
        </div>
        <ul className="space-y-0 px-2">
          {sections.map((section) => (
            <TreeNode
              key={section.href}
              node={section}
              depth={0}
              activeHref={activeHref}
              expandedMap={expandedMap}
              ancestorHrefs={ancestorHrefs}
              onToggleExpand={handleToggleExpand}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <>
      <aside
        aria-label="Navigasi topik"
        className="hidden lg:block w-[276px] shrink-0 border-r border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)] sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto"
      >
        {navContent(() => {})}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: CARBON_EASE }}
              className="fixed inset-0 bg-[#161616]/60"
              onClick={onCloseMobile}
              aria-hidden="true"
            />
            <motion.aside
              id="mobile-sidebar"
              aria-label="Menu topik seluler"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.18, ease: CARBON_EASE }}
              className="fixed inset-y-0 left-0 z-50 w-[300px] max-w-[85vw] overflow-y-auto border-r border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)]"
            >
              <div className="flex h-[64px] items-center justify-between border-b border-[var(--cds-border-subtle)] px-4">
                <span className="text-[0.92rem] font-semibold text-[var(--cds-text-primary)]">
                  Navigasi Direktori
                </span>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  aria-label="Tutup menu"
                  className="rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-02)] p-1.5 text-[var(--cds-text-primary)] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {navContent(onCloseMobile)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
