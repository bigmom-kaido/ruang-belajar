import type {
  BadgeFilter,
  IndexedDirectory,
  RawDirectory,
  RawSection,
  RouteState,
  SectionNode,
  StatusFilter,
} from '../types/directory';

const numberFormat = new Intl.NumberFormat('id-ID');

const topicAliases = new Map<string, string>([
  ['Documentaries', 'dokumenter film'],
  ['Courses', 'kursus kuliah'],
  ['Learning Sites', 'situs belajar'],
  ['Art Galleries / Collections', 'galeri seni museum'],
  ['Virtual Tours', 'tur virtual'],
  ['Science / Math', 'sains matematika'],
  ['Math', 'matematika kalkulus aljabar'],
  ['Physics', 'fisika kuantum'],
  ['Engineering', 'teknik rekayasa elektronika'],
  ['Chemistry', 'kimia'],
  ['Periodic Tables', 'tabel periodik'],
  ['Biology', 'biologi'],
  ['Med School', 'kedokteran medis'],
  ['Space', 'antariksa luar angkasa'],
  ['Astronomy', 'astronomi bintang'],
  ['Spacecraft', 'roket wahana antariksa'],
  ['Aerospace Engineering', 'kedirgantaraan penerbangan'],
  ['History', 'sejarah'],
  ['Humanities', 'humaniora sosial'],
  ['Economics', 'ekonomi'],
  ['Philosophy', 'filsafat logika'],
  ['Skills / Hobbies / DIY', 'keterampilan hobi diy'],
  ['Music', 'musik gitar piano'],
  ['Art / Editing', 'seni menggambar desain'],
  ['Chess', 'catur'],
  ['Language Learning', 'belajar bahasa'],
  ['Japanese', 'bahasa jepang kanji'],
  ['Korean', 'bahasa korea hangul'],
  ['Chinese', 'bahasa mandarin'],
  ['English', 'bahasa inggris'],
  ['Developer Learning', 'pemrograman coding developer'],
  ['Web Development', 'pengembangan web html css javascript'],
  ['Computer Science', 'ilmu komputer algoritma'],
  ['Data Science', 'ilmu data statistik'],
  ['Cybersecurity', 'keamanan siber'],
  ['Game Development', 'pengembangan game'],
  ['AI / ML Learning', 'kecerdasan buatan machine learning'],
  ['Exam Prep', 'persiapan ujian tes'],
  ['Educational Tools', 'alat belajar kamus kalkulator'],
  ['Flashcards', 'kartu belajar anki'],
  ['Dictionaries / Thesaurus', 'kamus tesaurus'],
  ['Encyclopedias', 'ensiklopedia'],
]);

export const BADGE_LABELS: Record<'⭐' | '🌐' | '↪️', string> = {
  '⭐': 'Pilihan wiki',
  '🌐': 'Kumpulan tautan',
  '↪️': 'Rujukan silang',
};

export function formatNumber(count: number): string {
  return numberFormat.format(count);
}

export function countLabel(count: number, noun: string): string {
  return `${numberFormat.format(count)} ${noun}`;
}

export function normalizeText(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
}

export function slugify(value: string): string {
  return (
    normalizeText(value)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'topik'
  );
}

export function externalUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

export function cleanQuery(query: string | null | undefined): string {
  return String(query ?? '')
    .slice(0, 160)
    .trim()
    .replace(/\s+/g, ' ');
}

export function getSectionPath(section: SectionNode): SectionNode[] {
  const path: SectionNode[] = [];
  let current: SectionNode | null = section;
  while (current) {
    path.unshift(current);
    current = current.parent;
  }
  return path;
}

export function indexDirectory(data: RawDirectory): IndexedDirectory {
  if (
    !data ||
    !Array.isArray(data.sections) ||
    !data.sections.length ||
    !data.resources ||
    typeof data.resources !== 'object' ||
    Array.isArray(data.resources)
  ) {
    throw new Error('Struktur direktori tidak valid.');
  }

  const resources = new Map(Object.entries(data.resources));
  const paths = new Map<string, SectionNode[]>();
  const routes = new Map<string, SectionNode>();

  function makeSection(
    raw: RawSection,
    parent: SectionNode | null,
    index: number
  ): SectionNode {
    const ids = raw.resource_ids ?? [];
    const children = raw.subsections ?? [];
    if (
      typeof raw.title !== 'string' ||
      !raw.title.trim() ||
      !Array.isArray(ids) ||
      !Array.isArray(children)
    ) {
      throw new Error('Struktur topik tidak valid.');
    }
    const base = `${parent ? parent.href : '#/topik'}/${slugify(raw.title)}`;
    let href = base;
    let suffix = 2;
    while (routes.has(href)) {
      href = `${base}-${suffix++}`;
    }

    const section: SectionNode = {
      title: raw.title,
      href,
      parent,
      index,
      ids: [...new Set(ids)],
      children: [],
      total: new Set<string>(),
    };

    routes.set(href, section);
    section.children = children.map((child, i) => makeSection(child, section, i));
    section.total = new Set(section.ids);
    for (const child of section.children) {
      for (const id of child.total) {
        section.total.add(id);
      }
    }
    return section;
  }

  const sections = data.sections.map((raw, index) => makeSection(raw, null, index));

  for (const section of routes.values()) {
    for (const id of section.ids) {
      if (!resources.has(id)) {
        throw new Error('Ada rujukan sumber yang tidak valid.');
      }
      const list = paths.get(id) ?? [];
      list.push(section);
      paths.set(id, list);
    }
  }

  const searchIndex = [];
  for (const [id, resource] of resources) {
    if (
      !resource ||
      typeof resource.title !== 'string' ||
      !Array.isArray(resource.links) ||
      !resource.links.every(
        (item) => item && typeof item.url === 'string' && typeof item.label === 'string'
      )
    ) {
      throw new Error('Struktur sumber belajar tidak valid.');
    }
    const title = normalizeText(resource.title);
    const topics = (paths.get(id) ?? []).flatMap((section) =>
      getSectionPath(section).map((node) => node.title)
    );
    const topicText = topics.flatMap((topic) => [topic, topicAliases.get(topic) ?? '']);
    const details = [
      resource.description ?? '',
      resource.text ?? '',
      ...resource.links.flatMap((item) => [item.label, item.url]),
      ...topicText,
    ];
    searchIndex.push({
      id,
      title,
      text: `${title} ${normalizeText(details.join(' '))}`,
    });
  }

  return {
    sections,
    routes,
    resources,
    paths,
    searchIndex,
    source: data.navigation?.[0],
  };
}

export function readRoute(directory: IndexedDirectory): RouteState {
  const hash = window.location.hash || '#/';
  const question = hash.indexOf('?');
  const path = question < 0 ? hash : hash.slice(0, question);

  if (path === '#/' || path === '' || path === '#main') {
    return { type: 'home' };
  }
  if (path === '#/tersimpan') {
    return { type: 'bookmarks' };
  }
  if (path === '#/dipelajari') {
    return { type: 'learned' };
  }
  if (path === '#/cari') {
    const query = cleanQuery(
      new URLSearchParams(question < 0 ? '' : hash.slice(question + 1)).get('q')
    );
    return query ? { type: 'search', query } : { type: 'home' };
  }
  const section = directory.routes.get(path);
  return section ? { type: 'section', section } : { type: 'missing' };
}

export function matchingIds(directory: IndexedDirectory, query: string): string[] {
  const normalized = normalizeText(query);
  const terms = normalized.split(' ').filter(Boolean);
  if (!terms.length) return [];

  return directory.searchIndex
    .filter((item) => terms.every((term) => item.text.includes(term)))
    .map((item) => {
      const score =
        item.title === normalized
          ? 3
          : item.title.startsWith(normalized)
            ? 2
            : terms.every((term) => item.title.includes(term))
              ? 1
              : 0;
      return { id: item.id, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.id);
}

export function filterResourceIds(
  ids: string[],
  directory: IndexedDirectory,
  bookmarks: Set<string>,
  learned: Set<string>,
  badgeFilter: BadgeFilter,
  statusFilter: StatusFilter
): string[] {
  return ids.filter((id) => {
    const res = directory.resources.get(id);
    if (!res) return false;
    if (badgeFilter !== 'all' && res.badge !== badgeFilter) return false;
    if (statusFilter === 'bookmarked' && !bookmarks.has(id)) return false;
    if (statusFilter === 'learned' && !learned.has(id)) return false;
    if (statusFilter === 'unlearned' && learned.has(id)) return false;
    return true;
  });
}

export function pickRandomResourceId(
  candidateIds: string[],
  directory: IndexedDirectory,
  learned: Set<string>,
  excludeId?: string | null
): string | null {
  const valid = candidateIds.filter((id) => {
    const res = directory.resources.get(id);
    return Boolean(res && res.type !== 'note' && res.links.length > 0);
  });
  if (!valid.length) return null;

  const withoutCurrent = valid.length > 1 && excludeId ? valid.filter((id) => id !== excludeId) : valid;
  const unlearned = withoutCurrent.filter((id) => !learned.has(id));
  const pool = unlearned.length > 0 ? unlearned : withoutCurrent;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? null;
}

export function getBadgeCounts(
  ids: string[],
  directory: IndexedDirectory
): Record<BadgeFilter, number> {
  const counts: Record<BadgeFilter, number> = {
    all: ids.length,
    '⭐': 0,
    '🌐': 0,
    '↪️': 0,
  };
  for (const id of ids) {
    const badge = directory.resources.get(id)?.badge;
    if (badge === '⭐' || badge === '🌐' || badge === '↪️') {
      counts[badge]++;
    }
  }
  return counts;
}
