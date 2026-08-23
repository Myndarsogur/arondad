export const DEFAULT_PAGE_WORDS = 210;

/**
 * Loads the small UTF-8 manuscript file once and indexes it by audio filename.
 */
export async function loadManuscript(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Handrit fannst ekki (${response.status})`);
  return parseManuscript(await response.text());
}

export function parseManuscript(rawText) {
  const entries = {};
  let entry = null;
  let page = null;

  function beginPage(time = null) {
    if (!entry) return;
    page = { text: "", startSeconds: parseTime(time) };
    entry.pages.push(page);
  }

  for (const rawLine of rawText.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trimEnd();
    if (line.startsWith("#")) continue;

    const track = line.match(/^@@track\s+(.+?)\s*$/i);
    if (track) {
      const fileName = track[1].trim();
      entry = { fileName, title: null, pages: [] };
      entries[fileName] = entry;
      page = null;
      continue;
    }

    const title = line.match(/^@@title\s+(.+?)\s*$/i);
    if (title && entry) {
      entry.title = title[1].trim();
      continue;
    }

    const pageBreak = line.match(/^@@page(?:\s+([0-9:.]+))?\s*$/i);
    if (pageBreak && entry) {
      beginPage(pageBreak[1] || null);
      continue;
    }

    if (!entry || !line.trim() && !page) continue;
    if (!page) beginPage();
    page.text += `${page.text ? "\n" : ""}${line}`;
  }

  for (const item of Object.values(entries)) {
    item.pages = item.pages.filter((itemPage) => itemPage.text.trim()).map((itemPage) => ({ ...itemPage, text: itemPage.text.trim() }));
  }
  return entries;
}

function parseTime(value) {
  if (!value) return null;
  const parts = value.split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}
