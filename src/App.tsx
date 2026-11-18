/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, RotateCw, Shuffle } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Breadcrumbs } from './components/Breadcrumbs';
import { CollectionView } from './components/CollectionView';
import { FilterBar } from './components/FilterBar';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ResourceGrid } from './components/ResourceGrid';
import { Sidebar } from './components/Sidebar';
import { SurpriseSpotlight } from './components/SurpriseSpotlight';
import { TopicGrid } from './components/TopicGrid';
import { useUserProgress } from './hooks/useUserProgress';
import type {
  BadgeFilter,
  IndexedDirectory,
  RawDirectory,
  RouteState,
  StatusFilter,
} from './types/directory';
import {
  cleanQuery,
  countLabel,
  externalUrl,
  filterResourceIds,
  formatNumber,
  getBadgeCounts,
  indexDirectory,
  matchingIds,
  pickRandomResourceId,
  readRoute,
} from './utils/directory';

const DATA_URL = '/assets/aistudio/educational_7df2135d.json';
const CARBON_EASE = [0.2, 0, 0.38, 0.9] as const;

export default function App() {
  const [directory, setDirectory] = useState<IndexedDirectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteState>({ type: 'home' });

  const [searchValue, setSearchValue] = useState('');
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<number | null>(null);

  const {
    bookmarks,
    learned,
    theme,
    toggleBookmark,
    toggleLearned,
    toggleTheme,
    clearBookmarks,
    clearLearned,
    exportProgress,
    importProgress,
  } = useUserProgress();

  const loadDirectory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(DATA_URL);
      if (!response.ok) {
        throw new Error(`Gagal memuat data direktori (HTTP ${response.status}).`);
      }
      const raw = (await response.json()) as RawDirectory;
      const indexed = indexDirectory(raw);
      setDirectory(indexed);
      const initialRoute = readRoute(indexed);
      setRoute(initialRoute);
      if (initialRoute.type === 'search') {
        setSearchValue(initialRoute.query);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat membaca direktori.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDirectory();
  }, [loadDirectory]);

  useEffect(() => {
    if (!directory) return;

    const handleHashChange = () => {
      const nextRoute = readRoute(directory);
      setRoute(nextRoute);
      setMobileMenuOpen(false);
      setSpotlightId(null);
      if (nextRoute.type === 'search') {
        setSearchValue(nextRoute.query);
      } else {
        setSearchValue('');
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [directory]);

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  useEffect(() => {
    let title = 'Ruang Belajar · Direktori Pembelajaran Terkurasi';
    if (route.type === 'section') {
      title = `${route.section.title} · Ruang Belajar`;
    } else if (route.type === 'search') {
      title = `Cari: ${route.query} · Ruang Belajar`;
    } else if (route.type === 'bookmarks') {
      title = 'Sumber Tersimpan · Ruang Belajar';
    } else if (route.type === 'learned') {
      title = 'Sudah Dipelajari · Ruang Belajar';
    } else if (route.type === 'missing') {
      title = 'Topik Tidak Ditemukan · Ruang Belajar';
    }
    document.title = title;
  }, [route]);

  const navigateSearch = useCallback(
    (rawQuery: string, replaceHistory: boolean) => {
      if (!directory) return;
      const cleaned = cleanQuery(rawQuery);
      const nextHash = cleaned
        ? `#/cari?q=${encodeURIComponent(cleaned)}`
        : '#/';
      if (window.location.hash !== nextHash) {
        if (replaceHistory && route.type === 'search') {
          window.history.replaceState(null, '', nextHash);
        } else {
          window.history.pushState(null, '', nextHash);
        }
      }
      const nextRoute = readRoute(directory);
      setRoute(nextRoute);
      setSpotlightId(null);
    },
    [directory, route.type]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
      }
      searchTimerRef.current = window.setTimeout(() => {
        navigateSearch(value, true);
      }, 160);
    },
    [navigateSearch]
  );

  const handleSearchSubmit = useCallback(
    (value: string) => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
      }
      navigateSearch(value, false);
    },
    [navigateSearch]
  );

  const handleSearchClear = useCallback(() => {
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
    }
    setSearchValue('');
    navigateSearch('', false);
    searchInputRef.current?.focus();
  }, [navigateSearch]);

  const resetFilters = useCallback(() => {
    setBadgeFilter('all');
    setStatusFilter('all');
  }, []);

  const allResourceIds = useMemo(
    () => (directory ? Array.from(directory.resources.keys()) : []),
    [directory]
  );

  const validIdSet = useMemo(() => new Set(allResourceIds), [allResourceIds]);

  const rollSurpriseFrom = useCallback(
    (pool: string[]) => {
      if (!directory) return;
      const picked = pickRandomResourceId(pool, directory, learned, spotlightId);
      if (picked) {
        setSpotlightId(picked);
        const res = directory.resources.get(picked);
        if (res) {
          setAnnouncement(`Kejutan acak memilih: ${res.title}`);
        }
      }
    },
    [directory, learned, spotlightId]
  );

  const searchRawIds = useMemo(() => {
    if (!directory || route.type !== 'search') return [];
    return matchingIds(directory, route.query);
  }, [directory, route]);

  const searchFilteredIds = useMemo(() => {
    if (!directory || route.type !== 'search') return [];
    return filterResourceIds(
      searchRawIds,
      directory,
      bookmarks,
      learned,
      badgeFilter,
      statusFilter
    );
  }, [directory, route, searchRawIds, bookmarks, learned, badgeFilter, statusFilter]);

  const sectionRawIds = useMemo(() => {
    if (route.type !== 'section') return [];
    return route.section.ids;
  }, [route]);

  const sectionFilteredIds = useMemo(() => {
    if (!directory || route.type !== 'section') return [];
    return filterResourceIds(
      sectionRawIds,
      directory,
      bookmarks,
      learned,
      badgeFilter,
      statusFilter
    );
  }, [directory, route, sectionRawIds, bookmarks, learned, badgeFilter, statusFilter]);

  const bookmarkAllIds = useMemo(
    () => allResourceIds.filter((id) => bookmarks.has(id)),
    [allResourceIds, bookmarks]
  );

  const bookmarkFilteredIds = useMemo(() => {
    if (!directory) return [];
    return filterResourceIds(
      bookmarkAllIds,
      directory,
      bookmarks,
      learned,
      badgeFilter,
      'all'
    );
  }, [directory, bookmarkAllIds, bookmarks, learned, badgeFilter]);

  const learnedAllIds = useMemo(
    () => allResourceIds.filter((id) => learned.has(id)),
    [allResourceIds, learned]
  );

  const learnedFilteredIds = useMemo(() => {
    if (!directory) return [];
    return filterResourceIds(
      learnedAllIds,
      directory,
      bookmarks,
      learned,
      badgeFilter,
      'all'
    );
  }, [directory, learnedAllIds, bookmarks, learned, badgeFilter]);

  useEffect(() => {
    if (route.type === 'search') {
      setAnnouncement(
        `Ditemukan ${countLabel(searchFilteredIds.length, 'sumber')} untuk pencarian ${route.query}.`
      );
    }
  }, [route, searchFilteredIds.length]);

  const sourceHref = directory ? externalUrl(directory.source?.url) : null;

  const routeKey =
    route.type === 'section'
      ? `section:${route.section.href}`
      : route.type === 'search'
        ? `search:${route.query}`
        : route.type;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[var(--cds-background)] text-[var(--cds-text-primary)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-none focus:bg-[#0f62fe] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Lewati ke konten utama
        </a>

        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>

        <Header
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          onSearchSubmit={handleSearchSubmit}
          onSearchClear={handleSearchClear}
          theme={theme}
          onToggleTheme={toggleTheme}
          source={directory?.source}
          sourceHref={sourceHref}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          searchInputRef={searchInputRef}
        />

        {loading && (
          <main
            id="main-content"
            className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10"
          >
            <div className="space-y-6 animate-pulse">
              <div className="h-[260px] rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)]" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-[164px] rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)]"
                  />
                ))}
              </div>
            </div>
          </main>
        )}

        {!loading && error && (
          <main
            id="main-content"
            className="mx-auto flex max-w-[640px] flex-col items-center justify-center px-6 py-20 text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16, ease: CARBON_EASE }}
              className="rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)] p-8"
            >
              <AlertCircle className="mx-auto h-10 w-10 text-[var(--cds-support-danger)]" />
              <h1 className="font-display mt-4 text-[1.5rem] font-semibold text-[var(--cds-text-primary)]">
                Gagal memuat direktori
              </h1>
              <p className="mt-2 text-[0.92rem] text-[var(--cds-text-secondary)]">
                {error}
              </p>
              <button
                type="button"
                onClick={() => void loadDirectory()}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-none bg-[#0f62fe] px-4 text-[0.86rem] font-medium text-white hover:bg-[#0353e9] cursor-pointer"
              >
                <RotateCw className="h-4 w-4" />
                <span>Coba lagi</span>
              </button>
            </motion.div>
          </main>
        )}

        {!loading && !error && directory && (
          <div className="mx-auto flex max-w-[1440px]">
            <Sidebar
              sections={directory.sections}
              route={route}
              bookmarksCount={bookmarks.size}
              learnedCount={learned.size}
              mobileOpen={mobileMenuOpen}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />

            <main
              id="main-content"
              className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8"
            >
              <motion.div
                key={routeKey}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: CARBON_EASE }}
              >
                {route.type === 'home' && (
                  <div className="space-y-8">
                    <HeroSection
                      totalCount={directory.resources.size}
                      topicCount={directory.sections.length}
                      learnedCount={learned.size}
                      bookmarksCount={bookmarks.size}
                      onSurpriseClick={() => rollSurpriseFrom(allResourceIds)}
                    />

                    <AnimatePresence mode="wait">
                      {spotlightId && (
                        <SurpriseSpotlight
                          resourceId={spotlightId}
                          directory={directory}
                          isBookmarked={bookmarks.has(spotlightId)}
                          isLearned={learned.has(spotlightId)}
                          onToggleBookmark={toggleBookmark}
                          onToggleLearned={toggleLearned}
                          onRollAgain={() => rollSurpriseFrom(allResourceIds)}
                          onClose={() => setSpotlightId(null)}
                          scopeLabel="Seluruh direktori"
                        />
                      )}
                    </AnimatePresence>

                    <section id="topik-utama" className="space-y-4 scroll-mt-24">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--cds-border-subtle)] pb-3">
                        <div>
                          <h2 className="font-display text-[1.5rem] font-semibold text-[var(--cds-text-primary)]">
                            Topik utama
                          </h2>
                          <p className="text-[0.88rem] text-[var(--cds-text-secondary)]">
                            Pilih bidang untuk menelusuri subtopik dan daftar sumber belajar.
                          </p>
                        </div>
                        <p className="text-[0.8rem] text-[var(--cds-text-helper)]">
                          ⭐ Pilihan wiki · 🌐 Kumpulan tautan · ↪️ Rujukan silang
                        </p>
                      </div>

                      <TopicGrid sections={directory.sections} learned={learned} />
                    </section>
                  </div>
                )}

                {route.type === 'bookmarks' && (
                  <CollectionView
                    mode="bookmarks"
                    ids={bookmarkFilteredIds}
                    allCollectionIds={bookmarkAllIds}
                    directory={directory}
                    bookmarks={bookmarks}
                    learned={learned}
                    badgeFilter={badgeFilter}
                    onBadgeChange={setBadgeFilter}
                    onResetFilters={resetFilters}
                    onToggleBookmark={toggleBookmark}
                    onToggleLearned={toggleLearned}
                    onClearCollection={clearBookmarks}
                    onExportProgress={exportProgress}
                    onImportProgress={(rawJson) => importProgress(rawJson, validIdSet)}
                    spotlightId={spotlightId}
                    onRollSurprise={rollSurpriseFrom}
                    onCloseSpotlight={() => setSpotlightId(null)}
                  />
                )}

                {route.type === 'learned' && (
                  <CollectionView
                    mode="learned"
                    ids={learnedFilteredIds}
                    allCollectionIds={learnedAllIds}
                    directory={directory}
                    bookmarks={bookmarks}
                    learned={learned}
                    badgeFilter={badgeFilter}
                    onBadgeChange={setBadgeFilter}
                    onResetFilters={resetFilters}
                    onToggleBookmark={toggleBookmark}
                    onToggleLearned={toggleLearned}
                    onClearCollection={clearLearned}
                    onExportProgress={exportProgress}
                    onImportProgress={(rawJson) => importProgress(rawJson, validIdSet)}
                    spotlightId={spotlightId}
                    onRollSurprise={rollSurpriseFrom}
                    onCloseSpotlight={() => setSpotlightId(null)}
                  />
                )}

                {route.type === 'search' && (
                  <div className="space-y-6">
                    <header className="rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)] p-6">
                      <p className="font-mono-tabular text-[0.74rem] font-medium tracking-[0.06em] text-[var(--cds-link-primary)] uppercase">
                        Hasil Pencarian
                      </p>
                      <h1 className="font-display mt-1.5 text-[1.75rem] font-semibold leading-tight text-[var(--cds-text-primary)]">
                        “{route.query}”
                      </h1>
                      <p className="mt-1.5 font-mono-tabular text-[0.84rem] text-[var(--cds-text-helper)]">
                        {countLabel(searchFilteredIds.length, 'sumber')} cocok
                        {searchFilteredIds.length !== searchRawIds.length &&
                          ` dari ${formatNumber(searchRawIds.length)} total hasil`}
                      </p>
                    </header>

                    <FilterBar
                      badgeFilter={badgeFilter}
                      statusFilter={statusFilter}
                      onBadgeChange={setBadgeFilter}
                      onStatusChange={setStatusFilter}
                      badgeCounts={getBadgeCounts(searchRawIds, directory)}
                      filteredCount={searchFilteredIds.length}
                      onReset={resetFilters}
                      onSurprise={() => rollSurpriseFrom(searchFilteredIds)}
                    />

                    <AnimatePresence mode="wait">
                      {spotlightId && (
                        <SurpriseSpotlight
                          resourceId={spotlightId}
                          directory={directory}
                          isBookmarked={bookmarks.has(spotlightId)}
                          isLearned={learned.has(spotlightId)}
                          onToggleBookmark={toggleBookmark}
                          onToggleLearned={toggleLearned}
                          onRollAgain={() => rollSurpriseFrom(searchFilteredIds)}
                          onClose={() => setSpotlightId(null)}
                          scopeLabel={`Pencarian "${route.query}"`}
                        />
                      )}
                    </AnimatePresence>

                    <ResourceGrid
                      ids={searchFilteredIds}
                      directory={directory}
                      bookmarks={bookmarks}
                      learned={learned}
                      onToggleBookmark={toggleBookmark}
                      onToggleLearned={toggleLearned}
                      showPaths
                      onResetFilters={
                        badgeFilter !== 'all' || statusFilter !== 'all'
                          ? resetFilters
                          : undefined
                      }
                    />
                  </div>
                )}

                {route.type === 'section' && (() => {
                  const section = route.section;
                  const totalIds = Array.from(section.total);
                  let sectionLearnedCount = 0;
                  for (const id of section.total) {
                    if (learned.has(id)) sectionLearnedCount++;
                  }
                  const surprisePool =
                    sectionFilteredIds.length > 0 ? sectionFilteredIds : totalIds;

                  return (
                    <div className="space-y-6">
                      <div>
                        <Breadcrumbs section={section} />

                        <header className="rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)] p-6">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1.5">
                              <h1 className="font-display text-[1.9rem] font-semibold leading-tight text-[var(--cds-text-primary)]">
                                {section.title}
                              </h1>
                              <p className="text-[0.86rem] text-[var(--cds-text-secondary)]">
                                <span className="font-mono-tabular">
                                  {countLabel(section.total.size, 'sumber')}
                                </span>
                                {section.children.length > 0 && (
                                  <span>
                                    {' · '}
                                    {countLabel(section.children.length, 'subtopik')}
                                  </span>
                                )}
                                <span>
                                  {' · '}
                                  <span className="font-mono-tabular">
                                    {formatNumber(sectionLearnedCount)}
                                  </span>{' '}
                                  sudah dipelajari
                                </span>
                              </p>
                            </div>

                            {surprisePool.length > 0 && (
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                transition={{ duration: 0.1 }}
                                onClick={() => rollSurpriseFrom(surprisePool)}
                                className="inline-flex h-10 items-center gap-2 self-start rounded-none bg-[#0f62fe] px-4 text-[0.82rem] font-medium text-white hover:bg-[#0353e9] transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                <Shuffle className="h-3.5 w-3.5" />
                                <span>Acak di topik ini</span>
                              </motion.button>
                            )}
                          </div>
                        </header>
                      </div>

                      <AnimatePresence mode="wait">
                        {spotlightId && (
                          <SurpriseSpotlight
                            resourceId={spotlightId}
                            directory={directory}
                            isBookmarked={bookmarks.has(spotlightId)}
                            isLearned={learned.has(spotlightId)}
                            onToggleBookmark={toggleBookmark}
                            onToggleLearned={toggleLearned}
                            onRollAgain={() => rollSurpriseFrom(surprisePool)}
                            onClose={() => setSpotlightId(null)}
                            scopeLabel={section.title}
                          />
                        )}
                      </AnimatePresence>

                      {section.children.length > 0 && (
                        <section className="space-y-3">
                          <h2 className="font-display text-[1.25rem] font-semibold text-[var(--cds-text-primary)]">
                            Subtopik
                          </h2>
                          <TopicGrid sections={section.children} learned={learned} />
                        </section>
                      )}

                      {section.ids.length > 0 && (
                        <section className="space-y-4">
                          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--cds-border-subtle)] pb-2.5">
                            <h2 className="font-display text-[1.25rem] font-semibold text-[var(--cds-text-primary)]">
                              Daftar sumber
                            </h2>
                            <span className="font-mono-tabular text-[0.8rem] text-[var(--cds-text-helper)]">
                              Menampilkan {formatNumber(sectionFilteredIds.length)} dari{' '}
                              {formatNumber(section.ids.length)}
                            </span>
                          </div>

                          <FilterBar
                            badgeFilter={badgeFilter}
                            statusFilter={statusFilter}
                            onBadgeChange={setBadgeFilter}
                            onStatusChange={setStatusFilter}
                            badgeCounts={getBadgeCounts(section.ids, directory)}
                            filteredCount={sectionFilteredIds.length}
                            onReset={resetFilters}
                            onSurprise={() => rollSurpriseFrom(sectionFilteredIds)}
                          />

                          <ResourceGrid
                            ids={sectionFilteredIds}
                            directory={directory}
                            bookmarks={bookmarks}
                            learned={learned}
                            onToggleBookmark={toggleBookmark}
                            onToggleLearned={toggleLearned}
                            onResetFilters={
                              badgeFilter !== 'all' || statusFilter !== 'all'
                                ? resetFilters
                                : undefined
                            }
                          />
                        </section>
                      )}
                    </div>
                  );
                })()}

                {route.type === 'missing' && (
                  <div className="rounded-none border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)] p-10 text-center">
                    <p className="font-mono-tabular text-[0.76rem] font-semibold tracking-[0.08em] text-[var(--cds-text-helper)] uppercase">
                      404
                    </p>
                    <h1 className="font-display mt-2 text-[1.6rem] font-semibold text-[var(--cds-text-primary)]">
                      Topik tidak ditemukan
                    </h1>
                    <p className="mx-auto mt-2 max-w-[44ch] text-[0.9rem] text-[var(--cds-text-secondary)]">
                      Tautan topik yang kamu buka tidak tersedia dalam direktori saat ini.
                    </p>
                    <a
                      href="#/"
                      className="mt-5 inline-flex h-10 items-center rounded-none bg-[#0f62fe] px-4 text-[0.86rem] font-medium text-white hover:bg-[#0353e9] no-underline"
                    >
                      Kembali ke ikhtisar
                    </a>
                  </div>
                )}
              </motion.div>
            </main>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
