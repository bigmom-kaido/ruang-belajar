import type { SectionNode } from '../types/directory';
import { getSectionPath } from '../utils/directory';

interface BreadcrumbsProps {
  section: SectionNode;
}

export function Breadcrumbs({ section }: BreadcrumbsProps) {
  const path = getSectionPath(section);

  return (
    <nav
      aria-label="Jejak halaman"
      className="mb-3 flex flex-wrap items-center gap-1.5 text-[0.82rem] text-[var(--cds-text-secondary)]"
    >
      <a
        href="#/"
        className="font-medium text-[var(--cds-link-primary)] hover:underline no-underline"
      >
        Ikhtisar
      </a>
      {path.map((node, index) => {
        const isLast = index === path.length - 1;
        return (
          <span key={node.href} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="text-[var(--cds-text-helper)]">
              /
            </span>
            {isLast ? (
              <span className="font-medium text-[var(--cds-text-primary)]">
                {node.title}
              </span>
            ) : (
              <a
                href={node.href}
                className="text-[var(--cds-link-primary)] hover:underline no-underline"
              >
                {node.title}
              </a>
            )}
          </span>
        );
      })}
    </nav>
  );
}
