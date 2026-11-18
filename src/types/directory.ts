export interface RawLink {
  label: string;
  url: string;
  separator?: string;
  annotation?: string;
  prefix?: string;
}

export interface RawResource {
  title: string;
  badge?: string;
  description?: string;
  text?: string;
  type?: string;
  links: RawLink[];
}

export interface RawSection {
  title: string;
  resource_ids?: string[];
  subsections?: RawSection[];
}

export interface RawDirectory {
  source_file?: string;
  navigation?: Array<{ label: string; url: string }>;
  sections: RawSection[];
  resources: Record<string, RawResource>;
}

export interface SectionNode {
  title: string;
  href: string;
  parent: SectionNode | null;
  index: number;
  ids: string[];
  children: SectionNode[];
  total: Set<string>;
}

export interface SearchEntry {
  id: string;
  title: string;
  text: string;
}

export interface IndexedDirectory {
  sections: SectionNode[];
  routes: Map<string, SectionNode>;
  resources: Map<string, RawResource>;
  paths: Map<string, SectionNode[]>;
  searchIndex: SearchEntry[];
  source?: { label: string; url: string };
}

export type BadgeFilter = 'all' | '⭐' | '🌐' | '↪️';
export type StatusFilter = 'all' | 'unlearned' | 'bookmarked' | 'learned';
export type ThemeMode = 'light' | 'dark';

export type RouteState =
  | { type: 'home' }
  | { type: 'bookmarks' }
  | { type: 'learned' }
  | { type: 'search'; query: string }
  | { type: 'section'; section: SectionNode }
  | { type: 'missing' };

export interface UserProgressSnapshot {
  version: number;
  exportedAt: string;
  bookmarks: string[];
  learned: string[];
}
