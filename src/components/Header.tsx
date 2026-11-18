import { useRef, type FormEvent, type KeyboardEvent } from 'react';
import { ExternalLink, Menu, Moon, Search, Sun, X } from 'lucide-react';
import type { ThemeMode } from '../types/directory';

interface HeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (value: string) => void;
  onSearchClear: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  source?: { label: string; url: string };
  sourceHref: string | null;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export function Header({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onSearchClear,
  theme,
  onToggleTheme,
  source,
  sourceHref,
  mobileMenuOpen,
  onToggleMobileMenu,
  searchInputRef,
}: HeaderProps) {
  const composingRef = useRef(false);
  const isMac =
    typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearchSubmit(searchValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && searchValue) {
      e.preventDefault();
      onSearchClear();
    }
  };

  return (
    <header className="sticky top-0 z-30 h-[64px] border-b border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)]">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-sidebar"
            aria-label={mobileMenuOpen ? 'Tutup menu topik' : 'Buka menu topik'}
            className="inline-flex lg:hidden items-center justify-center rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-02)] p-2 text-[var(--cds-text-primary)] hover:bg-[var(--cds-layer-hover)] transition-colors duration-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <a
            href="#/"
            className="group flex items-center gap-3 text-[var(--cds-text-primary)] no-underline whitespace-nowrap shrink-0"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 flex-col justify-center gap-[4px] rounded-none bg-[#161616] px-[6px] dark:bg-[#0f62fe]"
            >
              <span className="h-[2px] w-full bg-[#ffffff]" />
              <span className="h-[2px] w-[70%] bg-[#78a9ff] dark:bg-[#ffffff]" />
              <span className="h-[2px] w-[88%] bg-[#f4f4f4]/85" />
            </span>
            <span className="text-[0.98rem] font-semibold tracking-[-0.01em] whitespace-nowrap">
              Ruang Belajar
            </span>
          </a>
        </div>

        <form
          role="search"
          onSubmit={handleSubmit}
          className="relative flex-1 max-w-[520px] min-w-0"
        >
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cds-text-helper)]"
          />
          <input
            ref={searchInputRef}
            type="search"
            value={searchValue}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={(e) => {
              composingRef.current = false;
              onSearchChange(e.currentTarget.value);
            }}
            onChange={(e) => {
              onSearchChange(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Cari topik, kursus, atau situs..."
            aria-label="Cari sumber belajar"
            className="h-10 w-full rounded-none border-0 border-b border-[var(--cds-border-strong)] bg-[var(--cds-field)] pl-9 pr-16 text-[0.88rem] text-[var(--cds-text-primary)] placeholder:text-[var(--cds-text-helper)] focus:border-b-2 focus:border-[var(--cds-interactive)] focus:outline-none transition-colors duration-100 [&::-webkit-search-cancel-button]:hidden"
          />
          {searchValue ? (
            <button
              type="button"
              onClick={onSearchClear}
              aria-label="Hapus pencarian"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-none p-1 text-[var(--cds-text-helper)] hover:bg-[var(--cds-layer-hover)] hover:text-[var(--cds-text-primary)] transition-colors duration-100 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd
              aria-hidden="true"
              className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center rounded-[2px] border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)] px-1.5 py-0.5 font-mono-tabular text-[0.68rem] text-[var(--cds-text-helper)] sm:inline-flex"
            >
              {isMac ? '⌘ K' : 'Ctrl K'}
            </kbd>
          )}
        </form>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            title={theme === 'dark' ? 'Mode terang (White/Gray 10)' : 'Mode gelap (Gray 100)'}
            className="inline-flex h-10 items-center gap-2 rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-02)] px-3 text-[0.82rem] font-medium text-[var(--cds-text-primary)] hover:bg-[var(--cds-layer-hover)] transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-[#f1c21b]" />
                <span className="hidden md:inline">Terang</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-[#0f62fe]" />
                <span className="hidden md:inline">Gelap</span>
              </>
            )}
          </button>

          {sourceHref && (
            <a
              href={sourceHref}
              target="_blank"
              rel="noopener noreferrer"
              title={source?.label || 'Wiki sumber'}
              className="hidden sm:inline-flex h-10 items-center gap-2 rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)] px-3 text-[0.82rem] font-medium text-[var(--cds-text-primary)] hover:bg-[var(--cds-layer-hover)] transition-colors duration-100 no-underline whitespace-nowrap shrink-0"
            >
              <span>Wiki sumber</span>
              <ExternalLink className="h-3.5 w-3.5 text-[var(--cds-link-primary)]" />
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
