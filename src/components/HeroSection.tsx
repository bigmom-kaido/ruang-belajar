import { ArrowDown, Shuffle } from 'lucide-react';
import { formatNumber } from '../utils/directory';

interface HeroSectionProps {
  totalCount: number;
  topicCount: number;
  learnedCount: number;
  bookmarksCount: number;
  onSurpriseClick: () => void;
}

export function HeroSection({
  totalCount,
  topicCount,
  learnedCount,
  bookmarksCount,
  onSurpriseClick,
}: HeroSectionProps) {
  const learnedPct = totalCount > 0 ? Math.round((learnedCount / totalCount) * 100) : 0;

  return (
    <section className="border border-[var(--cds-border-subtle)] bg-[var(--cds-layer-01)]">
      <div className="grid md:grid-cols-[1.3fr_0.85fr]">
        <div className="flex flex-col justify-between gap-7 p-6 sm:p-8 lg:p-10">
          <div className="space-y-4">
            <p className="font-mono-tabular text-[0.74rem] font-medium tracking-[0.06em] text-[var(--cds-text-helper)] uppercase">
              Direktori Pembelajaran Terkurasi
            </p>
            <h1 className="font-display headline-balance text-[2rem] font-semibold leading-[1.12] tracking-[-0.02em] text-[var(--cds-text-primary)] sm:text-[2.65rem]">
              Jelajahi sumber belajar.
            </h1>
            <p className="max-w-[54ch] text-[0.96rem] leading-[1.6] text-[var(--cds-text-secondary)]">
              Indeks terbuka untuk kursus, dokumenter, kamus, dan situs belajar pilihan. Simpan yang ingin dibuka nanti dan catat topik yang sudah selesai dipelajari.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onSurpriseClick}
                className="inline-flex h-11 items-center gap-3 rounded-none bg-[#0f62fe] px-5 text-[0.88rem] font-medium text-white hover:bg-[#0353e9] transition-colors duration-100 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Shuffle className="h-4 w-4" />
                <span>Kejutan Acak</span>
              </button>

              <a
                href="#topik-utama"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('topik-utama')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex h-11 items-center gap-2 rounded-none border border-[var(--cds-border-strong)] bg-transparent px-4 text-[0.88rem] font-medium text-[var(--cds-text-primary)] hover:bg-[var(--cds-layer-hover)] transition-colors duration-100 no-underline whitespace-nowrap shrink-0"
              >
                <span>Lihat semua topik</span>
                <ArrowDown className="h-4 w-4 text-[var(--cds-link-primary)]" />
              </a>
            </div>
          </div>

          <dl className="grid grid-cols-3 border-t border-[var(--cds-border-subtle)] pt-5">
            <div className="pr-4 border-r border-[var(--cds-border-subtle)]">
              <dt className="text-[0.75rem] text-[var(--cds-text-helper)]">Entri unik</dt>
              <dd className="font-mono-tabular mt-1 text-[1.3rem] font-semibold text-[var(--cds-text-primary)]">
                {formatNumber(totalCount)}
              </dd>
            </div>
            <div className="px-4 border-r border-[var(--cds-border-subtle)]">
              <dt className="text-[0.75rem] text-[var(--cds-text-helper)]">Topik utama</dt>
              <dd className="font-mono-tabular mt-1 text-[1.3rem] font-semibold text-[var(--cds-text-primary)]">
                {formatNumber(topicCount)}
              </dd>
            </div>
            <div className="pl-4">
              <dt className="text-[0.75rem] text-[var(--cds-text-helper)]">Progres belajar</dt>
              <dd className="font-mono-tabular mt-1 text-[1.3rem] font-semibold text-[var(--cds-text-primary)]">
                {formatNumber(learnedCount)}
                <span className="ml-1.5 text-[0.76rem] font-normal text-[var(--cds-text-helper)]">
                  ({learnedPct}%)
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* IBM Carbon 2x Grid architectural composition */}
        <div
          aria-hidden="true"
          className="relative hidden min-h-[260px] items-center justify-center overflow-hidden border-l border-[var(--cds-border-subtle)] bg-[#161616] p-6 sm:flex dark:bg-[#000000]"
        >
          <div className="cds-grid-art absolute right-0 top-0 h-[58%] w-[62%] bg-[#0f62fe]" />
          <div className="absolute bottom-0 left-0 h-[36%] w-[34%] bg-[#007d79]" />

          <div className="relative z-10 w-full max-w-[268px] space-y-2.5">
            <div className="border border-[#525252] bg-[#ffffff] p-4 dark:bg-[#262626] dark:border-[#525252]">
              <div className="flex items-center justify-between font-mono-tabular text-[0.7rem] text-[#525252] dark:text-[#a8a8a8]">
                <span>PILIHAN WIKI</span>
                <span>01 / {formatNumber(topicCount)}</span>
              </div>
              <div className="font-display mt-2 text-[1.06rem] font-semibold leading-snug text-[#161616] dark:text-[#f4f4f4]">
                Sains, Sejarah, Kode & Bahasa
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[#e0e0e0] pt-2.5 font-mono-tabular text-[0.74rem] text-[#525252] dark:border-[#393939] dark:text-[#c6c6c6]">
                <span>Tersimpan: {formatNumber(bookmarksCount)}</span>
                <span className="text-[#0f62fe] dark:text-[#78a9ff]">
                  Selesai: {formatNumber(learnedCount)}
                </span>
              </div>
            </div>

            <div className="border border-[#393939] bg-[#262626] px-4 py-2.5 text-[#f4f4f4]">
              <div className="flex items-center justify-between text-[0.75rem]">
                <span className="font-medium">Kejutan Acak</span>
                <span className="font-mono-tabular text-[0.72rem] text-[#78a9ff]">
                  Siap dibuka
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
