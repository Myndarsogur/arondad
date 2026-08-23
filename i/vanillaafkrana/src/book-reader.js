import { books } from "./books.js";
import { loadManuscript, DEFAULT_PAGE_WORDS } from "./text-loader.js";

const $ = (selector) => document.querySelector(selector);
const audio = $("#audio");
const pageElement = $("#page");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

let currentPage = 0;
let currentTrackKey = null;
let pendingSeek = null;
let turning = false;
let manuscript = {};
let pages = [];

function splitAutomatically(text, targetWords = DEFAULT_PAGE_WORDS) {
  const paragraphs = text.trim().split(/\n\s*\n/).filter(Boolean);
  const pages = [];
  let page = [];
  let words = 0;
  for (const paragraph of paragraphs) {
    const count = paragraph.trim().split(/\s+/).length;
    if (page.length && words + count > targetWords) {
      pages.push(page.join("\n\n"));
      page = [];
      words = 0;
    }
    page.push(paragraph);
    words += count;
  }
  if (page.length) pages.push(page.join("\n\n"));
  return pages.length ? pages : [""];
}

function makePages() {
  let globalPage = 0;
  return books.flatMap((book, bookIndex) => book.chapters.flatMap((chapter, chapterIndex) => {
    const entry = manuscript[chapter.fileName];
    const placeholder = `Texti fyrir ${chapter.fileName} verður settur hér. Límdu handrit kaflans í src/manuscript.js. Lesarinn skiptir löngum texta sjálfkrafa á margar A6-síður og heldur þeim tengdum við þessa hljóðskrá.`;
    const rawPages = entry?.pages?.length ? entry.pages : [{ text: placeholder, startSeconds: null }];
    const textPages = rawPages.length > 1 ? rawPages.map((item) => item.text) : splitAutomatically(rawPages[0].text);
    const secondStarts = rawPages.length === textPages.length ? rawPages.map((item) => item.startSeconds) : null;
    return textPages.map((text, pageInTrack) => ({
      globalPage: globalPage++,
      book,
      bookIndex,
      chapter,
      chapterIndex,
      chapterTitle: entry?.title || chapter.title,
      text,
      pageInTrack,
      pagesInTrack: textPages.length,
      startRatio: pageInTrack / textPages.length,
      startSeconds: secondStarts?.[pageInTrack] ?? null,
      trackKey: `${bookIndex}-${chapterIndex}`,
    }));
  }));
}

const pages = makePages();

function paragraphs(text) {
  return text.split(/\n\s*\n/).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[character]));
}

function renderPage(index, direction = 0, forcePlay = false) {
  if (!pages.length) return;
  const nextIndex = Math.min(Math.max(index, 0), pages.length - 1);
  if (turning || nextIndex === currentPage && pageElement.dataset.ready) return;
  const wasPlaying = !audio.paused;
  const oldTrackKey = pages[currentPage]?.trackKey;
  currentPage = nextIndex;
  const page = pages[currentPage];
  turning = true;
  pageElement.classList.remove("turn-next", "turn-previous");
  if (direction) pageElement.classList.add(direction > 0 ? "turn-next" : "turn-previous");

  $("#page-book").textContent = page.book.title;
  $("#page-file").textContent = page.chapter.fileName;
  $("#chapter-label").textContent = `${page.book.title} · ${page.chapter.title}`;
  $("#chapter-title").textContent = page.chapterTitle;
  $("#page-text").innerHTML = paragraphs(page.text);
  $("#page-progress").textContent = page.pagesInTrack > 1 ? `${page.pageInTrack + 1} / ${page.pagesInTrack}` : "";
  $("#page-number").textContent = String(currentPage + 1);
  $("#track-book").textContent = page.book.title.toUpperCase();
  $("#track-title").textContent = `${page.chapterTitle} · ${page.chapter.fileName}`;
  $("#previous-page").disabled = currentPage === 0;
  $("#next-page").disabled = currentPage === pages.length - 1;
  pageElement.dataset.ready = "true";

  if (oldTrackKey !== page.trackKey || currentTrackKey !== page.trackKey) {
    currentTrackKey = page.trackKey;
    pendingSeek = page;
    audio.src = new URL(page.chapter.file, import.meta.url).href;
    if (wasPlaying || forcePlay) audio.play().catch(() => {});
  } else if (audio.duration) {
    audio.currentTime = pageStart(page, audio.duration);
  } else {
    pendingSeek = page;
  }
  setTimeout(() => { pageElement.classList.remove("turn-next", "turn-previous"); turning = false; }, reducedMotion.matches ? 0 : 380);
}

function pageStart(page, duration) {
  return page.startSeconds ?? page.startRatio * duration;
}

function visiblePageForTime(time) {
  const candidates = pages.filter((page) => page.trackKey === currentTrackKey);
  if (!candidates.length || !audio.duration) return null;
  return candidates.reduce((visible, page) => time >= pageStart(page, audio.duration) ? page : visible, candidates[0]);
}

function turn(amount, forcePlay = false) {
  const next = currentPage + amount;
  if (next < 0 || next >= pages.length) return;
  renderPage(next, amount, forcePlay);
}

function toggleAudio() {
  if (!pages.length) return;
  if (!audio.src) renderPage(currentPage);
  if (audio.paused) audio.play().catch(showAudioError);
  else audio.pause();
}

function showAudioError() { $("#track-title").textContent = "Ekki tókst að opna hljóðskrá"; }
function formatTime(seconds) { return Number.isFinite(seconds) ? `${String(Math.floor(seconds / 60)).padStart(2,"0")}:${String(Math.floor(seconds % 60)).padStart(2,"0")}` : "00:00"; }

function renderContents() {
  $("#contents-list").innerHTML = books.map((book, bookIndex) => `
    <section><h2>${escapeHtml(book.title)}</h2>${book.chapters.map((chapter, chapterIndex) => {
      const pageIndex = pages.findIndex((page) => page.bookIndex === bookIndex && page.chapterIndex === chapterIndex);
      return `<button type="button" data-page="${pageIndex}"><span>${escapeHtml(manuscript[chapter.fileName]?.title || chapter.title)}</span><small>${escapeHtml(chapter.fileName)}</small></button>`;
    }).join("")}</section>`).join("");
  document.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => { renderPage(Number(button.dataset.page), Number(button.dataset.page) > currentPage ? 1 : -1); closeContents(); }));
}

function openContents() { $("#contents").inert = false; $("#contents").classList.add("is-open"); $("#contents").setAttribute("aria-hidden", "false"); $("#contents-button").setAttribute("aria-expanded", "true"); $("#contents-close").focus(); }
function closeContents() { $("#contents").classList.remove("is-open"); $("#contents").setAttribute("aria-hidden", "true"); $("#contents").inert = true; $("#contents-button").setAttribute("aria-expanded", "false"); $("#contents-button").focus(); }

$("#previous-page").addEventListener("click", () => turn(-1));
$("#next-page").addEventListener("click", () => turn(1));
$("#audio-previous").addEventListener("click", () => turn(-1));
$("#audio-next").addEventListener("click", () => turn(1));
$("#play").addEventListener("click", toggleAudio);
$("#contents-button").addEventListener("click", openContents);
$("#contents-close").addEventListener("click", closeContents);
$("#seek").addEventListener("input", (event) => { if (audio.duration) audio.currentTime = Number(event.target.value) / 100 * audio.duration; });

audio.addEventListener("loadedmetadata", () => {
  if (pendingSeek) { audio.currentTime = pageStart(pendingSeek, audio.duration); pendingSeek = null; }
  $("#duration").textContent = formatTime(audio.duration);
});
audio.addEventListener("play", () => { $("#play").classList.add("is-playing"); $("#play").setAttribute("aria-label", "Gera hlé"); });
audio.addEventListener("pause", () => { $("#play").classList.remove("is-playing"); $("#play").setAttribute("aria-label", "Spila"); });
audio.addEventListener("timeupdate", () => {
  $("#elapsed").textContent = formatTime(audio.currentTime);
  $("#seek").value = audio.duration ? String(audio.currentTime / audio.duration * 100) : "0";
  if (!audio.paused) {
    const syncedPage = visiblePageForTime(audio.currentTime);
    if (syncedPage && syncedPage.globalPage !== currentPage) renderPage(syncedPage.globalPage, syncedPage.globalPage > currentPage ? 1 : -1);
  }
});
audio.addEventListener("ended", () => { if ($("#continuous").checked) turn(1, true); });
audio.addEventListener("error", showAudioError);

let touchX = null;
$("#reader").addEventListener("pointerdown", (event) => { if (event.target.closest("button")) return; touchX = event.clientX; });
$("#reader").addEventListener("pointerup", (event) => { if (touchX === null) return; const distance = event.clientX - touchX; touchX = null; if (Math.abs(distance) > 45) turn(distance < 0 ? 1 : -1); });
document.addEventListener("keydown", (event) => { if (event.key === "ArrowLeft") turn(-1); if (event.key === "ArrowRight") turn(1); if (event.key === "Escape" && $("#contents").classList.contains("is-open")) closeContents(); if (event.code === "Space" && !["BUTTON","INPUT"].includes(document.activeElement.tagName)) { event.preventDefault(); toggleAudio(); } });

async function initialise() {
  try {
    manuscript = await loadManuscript("./content/manuscript.txt");
  } catch (error) {
    console.error(error);
    $("#track-title").textContent = "Handrit fannst ekki — sýni vinnusíður";
  }
  pages = makePages();
  renderContents();
  renderPage(0);
}

initialise();
