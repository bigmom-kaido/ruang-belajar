'use strict';

const main = document.querySelector('#main');
const nav = document.querySelector('#topic-nav');
const homeLink = document.querySelector('#side-home');
const sidebar = document.querySelector('#sidebar');
const menu = document.querySelector('#menu-button');
const searchInput = document.querySelector('#search-input');
const searchForm = document.querySelector('#search-form');
const status = document.querySelector('#search-status');
const numberFormat = new Intl.NumberFormat('id-ID');
const desktop = window.matchMedia('(min-width: 731px)');
const pageSize = 48;
const icons = ['▸', '≡', '⊞', '∑', '✦', '⌁', '◷', '§', '◇', 'Aa', '⌘', '✓', '⊕'];
const topicAliases = new Map([
  ['Documentaries', 'dokumenter'],
  ['Courses', 'kursus'],
  ['Learning Sites', 'situs belajar'],
  ['Science / Math', 'sains matematika'],
  ['Math', 'matematika'],
  ['Physics', 'fisika'],
  ['Chemistry', 'kimia'],
  ['Biology', 'biologi'],
  ['Space', 'antariksa'],
  ['Astronomy', 'astronomi'],
  ['History', 'sejarah'],
  ['Language Learning', 'belajar bahasa'],
  ['Developer Learning', 'pemrograman'],
  ['Exam Prep', 'persiapan ujian'],
  ['Educational Tools', 'alat belajar']
]);

let directory;
let searchTimer;
let returnRoute = '#/';
let visibleRoute;

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

function link(label, href, className) {
  const anchor = element('a', className, label);
  anchor.href = href;
  return anchor;
}

function decoration(tag, className, content) {
  const node = element(tag, className, content);
  node.setAttribute('aria-hidden', 'true');
  return node;
}

function normalize(value) {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
}

function slug(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'topik';
}

function externalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function externalLink(item, showArrow) {
  const url = externalUrl(item.url);
  if (!url) return element('span', '', item.label);
  const anchor = link(item.label, url);
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  if (showArrow) anchor.append(decoration('span', 'external-icon'));
  return anchor;
}

function countLabel(count, noun) {
  return numberFormat.format(count) + ' ' + noun;
}

function cleanQuery(query) {
  return String(query ?? '').slice(0, 160).trim().replace(/\s+/g, ' ');
}

function readRoute() {
  const hash = location.hash || '#/';
  const question = hash.indexOf('?');
  const path = question < 0 ? hash : hash.slice(0, question);
  if (path === '#/' || path === '#main') return { type: 'home' };
  if (path === '#/cari') {
    const query = cleanQuery(new URLSearchParams(question < 0 ? '' : hash.slice(question + 1)).get('q'));
    return query ? { type: 'search', query } : { type: 'home' };
  }
  const section = directory.routes.get(path);
  return section ? { type: 'section', section } : { type: 'missing' };
}

function indexDirectory(data) {
  if (!data || !Array.isArray(data.sections) || !data.sections.length || !data.resources ||
      typeof data.resources !== 'object' || Array.isArray(data.resources)) {
    throw new Error('Struktur direktori tidak valid.');
  }
  const resources = new Map(Object.entries(data.resources));
  const paths = new Map();
  const routes = new Map();

  function makeSection(raw, parent, index) {
    const ids = raw.resource_ids ?? [];
    const children = raw.subsections ?? [];
    if (typeof raw.title !== 'string' || !raw.title.trim() || !Array.isArray(ids) || !Array.isArray(children)) {
      throw new Error('Struktur topik tidak valid.');
    }
    const base = (parent ? parent.href : '#/topik') + '/' + slug(raw.title);
    let href = base;
    let number = 2;
    while (routes.has(href)) href = base + '-' + number++;
    const section = { title: raw.title, href, parent, index, ids: [...new Set(ids)] };
    routes.set(href, section);
    section.children = children.map((child, i) => makeSection(child, section, i));
    section.total = new Set(section.ids);
    for (const child of section.children) {
      for (const id of child.total) section.total.add(id);
    }
    return section;
  }

  const sections = data.sections.map((raw, index) => makeSection(raw, null, index));
  for (const section of routes.values()) {
    for (const id of section.ids) {
      if (!resources.has(id)) throw new Error('Ada rujukan sumber yang tidak valid.');
      if (!paths.has(id)) paths.set(id, []);
      paths.get(id).push(section);
    }
  }

  const searchIndex = [];
  for (const [id, resource] of resources) {
    if (!resource || typeof resource.title !== 'string' || !Array.isArray(resource.links) ||
        !resource.links.every(item => item && typeof item.url === 'string' && typeof item.label === 'string')) {
      throw new Error('Struktur sumber belajar tidak valid.');
    }
    const title = normalize(resource.title);
    const topics = (paths.get(id) ?? []).flatMap(section => getSectionPath(section).map(node => node.title));
    const topicText = topics.flatMap(topic => [topic, topicAliases.get(topic)]);
    const details = [resource.description, resource.text, ...resource.links.flatMap(item => [item.label, item.url]), ...topicText];
    searchIndex.push({ id, title, text: title + ' ' + normalize(details.join(' ')) });
  }

  return { sections, routes, resources, paths, searchIndex, source: data.navigation?.[0] };
}

function buildNav(sections, depth = 0) {
  const list = element('ul', depth ? 'side-nested' : 'side-list');
  for (const section of sections) {
    const item = element('li', 'side-branch');
    const row = element('div', 'side-row');
    const anchor = link(section.title, section.href, 'side-link');
    section.navLink = anchor;
    row.append(anchor);
    item.append(row);
    if (section.children.length) {
      const nested = buildNav(section.children, depth + 1);
      nested.id = 'nav-' + section.href.slice(2).replaceAll('/', '--');
      const toggle = element('button', 'side-toggle');
      toggle.type = 'button';
      toggle.setAttribute('aria-controls', nested.id);
      toggle.setAttribute('aria-label', 'Subtopik ' + section.title);
      toggle.append(decoration('span', 'chevron'));
      section.toggle = toggle;
      section.nested = nested;
      setBranch(section, false);
      toggle.addEventListener('click', () => setBranch(section, nested.hidden));
      row.append(toggle);
      item.append(nested);
    }
    list.append(item);
  }
  return list;
}

function setBranch(section, expanded) {
  section.toggle.setAttribute('aria-expanded', String(expanded));
  section.nested.hidden = !expanded;
}

function setCurrent(route) {
  homeLink.removeAttribute('aria-current');
  for (const section of directory.routes.values()) section.navLink.removeAttribute('aria-current');
  if (route.type === 'home') homeLink.setAttribute('aria-current', 'page');
  if (route.type !== 'section') return;
  let section = route.section;
  section.navLink.setAttribute('aria-current', 'page');
  while (section) {
    if (section.toggle) setBranch(section, true);
    section = section.parent;
  }
}

function setMenu(expanded, restoreFocus = false) {
  const wasOpen = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(expanded));
  sidebar.classList.toggle('is-open', expanded);
  if (!expanded && restoreFocus && wasOpen && !desktop.matches) menu.focus();
}

function heroStat(total, label) {
  const stat = element('span', 'stat');
  stat.append(element('strong', '', numberFormat.format(total)), document.createTextNode(label));
  return stat;
}

function sectionHeading(title) {
  const wrapper = element('div', 'section-heading');
  wrapper.append(element('h2', '', title));
  return wrapper;
}

function topicGrid(sections) {
  const grid = element('div', 'topic-grid');
  for (const section of sections) {
    const anchor = link('', section.href, 'topic-card');
    const top = element('div', 'card-top');
    const symbol = section.parent ? '›' : icons[section.index % icons.length];
    top.append(decoration('span', 'topic-icon', symbol), decoration('span', 'card-arrow'));
    const label = element('div');
    label.append(element('span', 'card-title', section.title), element('span', 'card-count', countLabel(section.total.size, 'sumber')));
    anchor.append(top, label);
    grid.append(anchor);
  }
  return grid;
}

function renderHome() {
  const home = document.querySelector('#home-template').content.cloneNode(true);
  home.querySelector('.hero-stats').append(
    heroStat(directory.resources.size, 'entri unik'),
    heroStat(directory.sections.length, 'topik utama')
  );
  const categories = element('section', 'browse');
  categories.append(sectionHeading('Jelajahi topik'), topicGrid(directory.sections));
  main.append(home, categories);
}

function getSectionPath(section) {
  const path = [];
  while (section) {
    path.unshift(section);
    section = section.parent;
  }
  return path;
}

function pageHeader(title, info, ancestors = []) {
  const breadcrumbs = element('nav', 'crumbs');
  breadcrumbs.setAttribute('aria-label', 'Lokasi halaman');
  const crumbs = element('ol');
  const top = element('li');
  top.append(link('Ikhtisar', '#/'));
  crumbs.append(top);
  for (const section of ancestors) {
    const crumb = element('li');
    crumb.append(link(section.title, section.href));
    crumbs.append(crumb);
  }
  const current = element('li', '', title);
  current.setAttribute('aria-current', 'page');
  crumbs.append(current);
  breadcrumbs.append(crumbs);
  const header = element('div', 'doc-header');
  const heading = element('h1', '', title);
  heading.id = 'page-title';
  header.append(breadcrumbs, heading);
  if (info) header.append(element('p', 'doc-meta', info));
  main.append(header);
}

function renderResource(id, headingLevel, showOrigins) {
  const resource = directory.resources.get(id);
  const card = element('article', 'resource');
  const heading = element(headingLevel);
  const first = resource.links[0];
  const useFirstInHeading = Boolean(first && first.label === resource.title && resource.type !== 'note');
  if (useFirstInHeading) {
    heading.append(externalLink(first, true));
    if (first.annotation) heading.append(element('small', '', first.annotation));
  } else {
    heading.textContent = resource.title;
  }
  const badgeLabels = { '⭐': 'Pilihan wiki', '🌐': 'Kumpulan tautan', '↪️': 'Rujukan silang' };
  if (badgeLabels[resource.badge]) {
    const badge = element('span', 'resource-badge', resource.badge);
    badge.setAttribute('role', 'img');
    badge.setAttribute('aria-label', badgeLabels[resource.badge]);
    badge.title = badgeLabels[resource.badge];
    heading.append(badge);
  }
  card.append(heading);
  if (resource.description || resource.text) {
    card.append(element('p', '', resource.description || resource.text));
  }

  const additional = resource.links.slice(useFirstInHeading ? 1 : 0);
  if (additional.length) {
    const details = element('details');
    const list = element('ul', 'resource-links');
    for (const item of additional) {
      const row = element('li');
      if (item.prefix) row.append(document.createTextNode(item.prefix + ' '));
      row.append(externalLink(item, true));
      if (item.annotation) row.append(element('small', '', item.annotation));
      list.append(row);
    }
    details.append(element('summary', '', countLabel(additional.length, useFirstInHeading ? 'tautan terkait' : 'tautan')), list);
    card.append(details);
  }

  if (showOrigins && directory.paths.has(id)) {
    const origins = element('ul', 'resource-paths');
    origins.setAttribute('aria-label', 'Topik yang memuat sumber ini');
    for (const section of directory.paths.get(id)) {
      const origin = element('li');
      origin.append(link(getSectionPath(section).map(item => item.title).join(' / '), section.href));
      origins.append(origin);
    }
    card.append(origins);
  }
  return card;
}

function resourceGrid(ids, headingLevel, showOrigins) {
  const group = element('div');
  const grid = element('div', 'resource-grid');
  const button = element('button', 'load-more');
  button.type = 'button';
  let rendered = 0;

  function appendPage(moveFocus) {
    const page = document.createDocumentFragment();
    const end = Math.min(rendered + pageSize, ids.length);
    let nextHeading;
    for (const id of ids.slice(rendered, end)) {
      const card = renderResource(id, headingLevel, showOrigins);
      nextHeading ??= card.querySelector(headingLevel);
      page.append(card);
    }
    grid.append(page);
    rendered = end;
    button.hidden = rendered === ids.length;
    button.textContent = 'Tampilkan ' + countLabel(Math.min(pageSize, ids.length - rendered), 'sumber lagi');
    if (moveFocus && nextHeading) {
      nextHeading.tabIndex = -1;
      nextHeading.focus();
    }
  }

  button.addEventListener('click', () => appendPage(true));
  appendPage(false);
  group.append(grid, button);
  return group;
}

function renderSection(section) {
  const stats = [countLabel(section.total.size, 'sumber')];
  if (section.children.length) stats.push(countLabel(section.children.length, 'subtopik'));
  const ancestors = getSectionPath(section).slice(0, -1);
  pageHeader(section.title, stats.join(' · '), ancestors);
  if (section.children.length) {
    const nested = element('section', 'doc-section');
    nested.append(sectionHeading('Subtopik'), topicGrid(section.children));
    main.append(nested);
  }
  if (section.ids.length) {
    const listing = element('section', 'doc-section');
    listing.append(sectionHeading('Daftar sumber'), resourceGrid(section.ids, 'h3', false));
    main.append(listing);
  }
  if (!section.total.size) main.append(element('p', 'empty-state', 'Topik ini belum memiliki sumber.'));
}

function matchingIds(query) {
  const normalized = normalize(query);
  const terms = normalized.split(' ').filter(Boolean);
  if (!terms.length) return [];
  return directory.searchIndex
    .filter(item => terms.every(term => item.text.includes(term)))
    .map(item => {
      const score = item.title === normalized ? 3 :
        item.title.startsWith(normalized) ? 2 :
        terms.every(term => item.title.includes(term)) ? 1 : 0;
      return { id: item.id, score };
    })
    .sort((first, second) => second.score - first.score)
    .map(item => item.id);
}

function renderSearch(query) {
  const ids = matchingIds(query);
  const message = countLabel(ids.length, 'hasil untuk') + ' “' + query + '”';
  pageHeader('Hasil pencarian', message);
  if (ids.length) {
    const results = element('section', 'doc-section');
    results.setAttribute('aria-label', 'Daftar hasil pencarian');
    results.append(resourceGrid(ids, 'h2', true));
    main.append(results);
  } else {
    main.append(element('p', 'empty-state', 'Coba kata kunci lain, misalnya Python, matematika, atau NASA.'));
  }
  status.textContent = message;
}

function renderRoute({ fromSearchInput = false, initial = false } = {}) {
  if (!directory) return;
  const route = readRoute();
  const query = route.type === 'search' ? route.query : '';
  if (!fromSearchInput) searchInput.value = query;
  searchForm.classList.toggle('has-value', Boolean(searchInput.value));
  setCurrent(route);
  main.replaceChildren();
  status.textContent = '';

  let title = 'Direktori sumber belajar';
  if (route.type === 'home') {
    renderHome();
  } else if (route.type === 'section') {
    renderSection(route.section);
    title = route.section.title;
  } else if (route.type === 'search') {
    renderSearch(route.query);
    title = 'Hasil pencarian';
  } else {
    title = 'Halaman tidak ditemukan';
    pageHeader(title);
    main.append(link('Kembali ke ikhtisar', '#/', 'back-link'));
  }
  document.title = 'Ruang Belajar · ' + title;
  visibleRoute = route;
  if (location.hash !== '#main') window.scrollTo(0, 0);
  if (!initial && !fromSearchInput) main.focus({ preventScroll: true });
}

function updateSearch() {
  const query = cleanQuery(searchInput.value);
  let next;
  if (query) {
    if (visibleRoute?.type !== 'search') returnRoute = location.hash.startsWith('#/topik/') ? location.hash : '#/';
    next = '#/cari?' + new URLSearchParams({ q: query });
  } else {
    if (visibleRoute?.type !== 'search') return;
    next = returnRoute;
  }
  if (next === location.hash) return;
  if (visibleRoute?.type === 'search') history.replaceState(null, '', next);
  else history.pushState(null, '', next);
  setMenu(false);
  renderRoute({ fromSearchInput: true });
}

function queueSearch() {
  clearTimeout(searchTimer);
  searchForm.classList.toggle('has-value', Boolean(searchInput.value));
  searchTimer = setTimeout(updateSearch, 150);
}

function showError(error) {
  main.replaceChildren();
  pageHeader('Direktori belum bisa dimuat');
  const card = element('div', 'empty-state');
  card.append(element('p', '', error.message));
  if (location.protocol === 'file:') {
    card.append(element('p', '', 'Jalankan situs melalui server HTTP lokal. Petunjuknya ada di README.md.'));
  } else {
    const retry = element('button', 'load-more', 'Coba lagi');
    retry.type = 'button';
    retry.addEventListener('click', loadDirectory, { once: true });
    card.append(retry);
  }
  main.append(card);
}

async function loadDirectory() {
  main.replaceChildren(element('p', 'loading', 'Memuat direktori…'));
  try {
    let response;
    try {
      response = await fetch('./educational.json');
    } catch {
      throw new Error('File educational.json tidak dapat diakses.');
    }
    if (!response.ok) throw new Error('File educational.json tidak dapat diakses (HTTP ' + response.status + ').');
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('File educational.json tidak berisi JSON yang valid.');
    }
    directory = indexDirectory(data);
    nav.replaceChildren(buildNav(directory.sections));
    const source = document.querySelector('#source-link');
    const sourceUrl = externalUrl(directory.source?.url);
    if (sourceUrl) {
      source.href = sourceUrl;
      source.hidden = false;
    }
    searchInput.disabled = false;
    renderRoute({ initial: true });
  } catch (error) {
    showError(error);
  }
}

searchInput.addEventListener('input', event => {
  if (!event.isComposing) queueSearch();
});
searchInput.addEventListener('compositionend', queueSearch);
searchForm.addEventListener('submit', event => {
  event.preventDefault();
  clearTimeout(searchTimer);
  updateSearch();
});
window.addEventListener('hashchange', () => {
  clearTimeout(searchTimer);
  if (location.hash === '#main') {
    main.focus();
    return;
  }
  setMenu(false);
  renderRoute();
});
document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  main.focus();
  main.scrollIntoView();
});
main.parentElement.addEventListener('click', event => {
  const anchor = event.target.closest('a[href^="#/"]');
  if (anchor && anchor.hash === location.hash && sidebar.contains(anchor)) setMenu(false, true);
});
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
desktop.addEventListener('change', () => setMenu(false));

const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
if (isMac) document.querySelector('#search-key').textContent = '⌘ K';
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !searchInput.disabled) {
    event.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
  if (event.key === 'Escape') {
    if (document.activeElement === searchInput && searchInput.value) {
      searchInput.value = '';
      clearTimeout(searchTimer);
      searchForm.classList.remove('has-value');
      updateSearch();
    } else {
      setMenu(false, true);
    }
  }
});

loadDirectory();
