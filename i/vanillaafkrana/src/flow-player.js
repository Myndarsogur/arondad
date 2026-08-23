import { books } from "./books.js";
import { loadManuscript, DEFAULT_PAGE_WORDS } from "./text-loader.js";
import { durationFor, formatDuration } from "./durations.js";

const $ = (selector) => document.querySelector(selector);
const audio = $("#audio");
const pageElement = $("#page");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const simpleMode = document.body.classList.contains("simple-ui");
const FLOW_PAGE_WORDS = Math.min(DEFAULT_PAGE_WORDS, 150);

let manuscript = {};
let pages = [];
let trackPages = new Map();
let pageIndex = 0;
let loadedTrack = null;
let pendingPlayback = false;
let followAudio = true;
let turning = false;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[character]));
}

function splitText(text, targetWords = FLOW_PAGE_WORDS) {
  const paragraphs = text.trim().split(/\n\s*\n/).filter(Boolean);
  const result = [];
  let current = [];
  let count = 0;
  const blocks = paragraphs.flatMap((paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length <= targetWords) return [paragraph];
    const sourceLines = paragraph.split("\n").filter((line) => line.trim());
    if (sourceLines.length > 1) {
      const chunks = [];
      let lines = [];
      let lineWords = 0;
      for (const line of sourceLines) {
        const count = line.split(/\s+/).filter(Boolean).length;
        if (lines.length && lineWords + count > targetWords) {
          chunks.push(lines.join("\n"));
          lines = [];
          lineWords = 0;
        }
        lines.push(line);
        lineWords += count;
      }
      if (lines.length) chunks.push(lines.join("\n"));
      return chunks;
    }
    const chunks = [];
    for (let index = 0; index < words.length; index += targetWords) chunks.push(words.slice(index,index+targetWords).join(" "));
    return chunks;
  });
  for (const paragraph of blocks) {
    const words = paragraph.split(/\s+/).filter(Boolean).length;
    if (current.length && count + words > targetWords) {
      result.push(current.join("\n\n"));
      current = [];
      count = 0;
    }
    current.push(paragraph);
    count += words;
  }
  if (current.length) result.push(current.join("\n\n"));
  return result.length ? result : [""];
}

function buildPages() {
  const all = [];
  let globalIndex = 0;
  books.forEach((book, bookIndex) => book.chapters.forEach((chapter, chapterIndex) => {
    const entry = manuscript[chapter.fileName];
    if (!entry) return;
    const sourcePages = entry ? entry.pages : [];
    const content = sourcePages.length > 1
      ? sourcePages
      : sourcePages.length === 1
        ? splitText(sourcePages[0].text).map((text) => ({ text, startSeconds:null }))
        : [];
    const key = `${bookIndex}-${chapterIndex}`;
    const perTrack = [{
      globalIndex:globalIndex++, key, kind:"title", book, bookIndex, chapter, chapterIndex,
      title:entry?.title || chapter.title, text:"", pageInTrack:0, contentCount:content.length,
      startSeconds:0,
    }];
    content.forEach((item, contentIndex) => perTrack.push({
      globalIndex:globalIndex++, key, kind:"text", book, bookIndex, chapter, chapterIndex,
      title:entry?.title || chapter.title, text:item.text, pageInTrack:contentIndex + 1,
      contentCount:content.length, startSeconds:item.startSeconds,
    }));
    trackPages.set(key, perTrack);
    all.push(...perTrack);
  }));
  return all;
}

function paragraphHtml(text) {
  return text.split(/\n\s*\n/).filter(Boolean).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

function isPoetry(text) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length < 3) return false;
  const shortLines = lines.filter((line) => line.length <= 62).length;
  return shortLines / lines.length >= .65;
}

function renderPage(nextIndex, direction = 0, { manual = false, keepPlaying = false } = {}) {
  if (!pages.length || turning) return;
  nextIndex = Math.min(Math.max(nextIndex, 0), pages.length - 1);
  const oldPage = pages[pageIndex];
  const nextPage = pages[nextIndex];
  const trackChanged = !oldPage || oldPage.key !== nextPage.key || loadedTrack !== nextPage.key;
  const wasPlaying = !audio.paused || keepPlaying;
  pageIndex = nextIndex;
  if (manual) setFollowing(false);

  pageElement.classList.toggle("is-title", nextPage.kind === "title");
  pageElement.classList.toggle("is-poetry", nextPage.kind === "text" && isPoetry(nextPage.text));
  pageElement.classList.remove("turn-next", "turn-previous");
  if (direction) pageElement.classList.add(direction > 0 ? "turn-next" : "turn-previous");
  $("#page-book").textContent = nextPage.book.title;
  $("#page-file").textContent = nextPage.title;
  $("#chapter-label").textContent = "";
  $("#chapter-title").textContent = nextPage.title;
  $("#page-text").innerHTML = nextPage.kind === "text" ? paragraphHtml(nextPage.text) : "";
  $("#track-progress").textContent = nextPage.kind === "text" ? `${nextPage.pageInTrack} / ${nextPage.contentCount}` : "";
  $("#page-number").textContent = String(pageIndex + 1);
  $("#track-file").textContent = nextPage.book.title.toUpperCase();
  $("#track-title").textContent = nextPage.title;
  $("#previous-page").disabled = pageIndex === 0;
  $("#next-page").disabled = pageIndex === pages.length - 1;

  if (trackChanged) loadAudio(nextPage, wasPlaying);
  turning = true;
  const turnDuration = reducedMotion.matches ? 0 : simpleMode ? 140 : 380;
  setTimeout(() => { pageElement.classList.remove("turn-next", "turn-previous"); turning = false; }, turnDuration);
}

function loadAudio(page, shouldPlay) {
  loadedTrack = page.key;
  pendingPlayback = shouldPlay;
  $(".flow-audio-bar").classList.add("is-loading");
  audio.src = new URL(page.chapter.file, import.meta.url).href;
  audio.load();
  if (shouldPlay) audio.play().catch(() => {});
}

function turn(amount, options = {}) {
  const target = pageIndex + amount;
  if (target < 0 || target >= pages.length) return;
  renderPage(target, amount, { manual:true, ...options });
}

function togglePlayback() {
  if (!pages.length) return;
  if (audio.paused) { setFollowing(true); audio.play().catch(showAudioError); }
  else audio.pause();
}

function setFollowing(value) {
  followAudio = value;
  $("#follow").classList.toggle("is-active", value);
  $("#follow").setAttribute("aria-pressed", String(value));
}

function syncPageToAudio() {
  if (!followAudio || audio.paused || !audio.duration || !loadedTrack) return;
  const candidates = trackPages.get(loadedTrack);
  if (!candidates?.length) return;
  const titleDuration = Math.min(3, audio.duration * .08);
  let target = candidates[0];
  const content = candidates.slice(1);
  for (let index = 0; index < content.length; index++) {
    const page = content[index];
    const proportional = titleDuration + (audio.duration - titleDuration) * index / content.length;
    const start = page.startSeconds && page.startSeconds > 0 ? page.startSeconds : proportional;
    if (audio.currentTime >= start) target = page;
  }
  if (target.globalIndex !== pageIndex) renderPage(target.globalIndex, target.globalIndex > pageIndex ? 1 : -1);
}

function showAudioError() { $("#track-title").textContent = "Ekki tókst að opna hljóðskrá"; }
function formatTime(seconds) { return Number.isFinite(seconds) ? `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(Math.floor(seconds%60)).padStart(2,"0")}` : "00:00"; }

function renderContents() {
  $("#contents-list").innerHTML = books.map((book, bookIndex) => `<section><h2>${escapeHtml(book.title)}</h2>${book.chapters.filter((chapter) => manuscript[chapter.fileName]).map((chapter) => {
    const chapterIndex = book.chapters.indexOf(chapter);
    const key = `${bookIndex}-${chapterIndex}`;
    const first = trackPages.get(key)?.[0];
    return `<button type="button" data-page="${first?.globalIndex ?? 0}"><span>${escapeHtml(manuscript[chapter.fileName]?.title || chapter.title)}</span><small>${formatDuration(durationFor(chapter.fileName))}</small></button>`;
  }).join("")}</section>`).join("");
  document.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => {
    const target = Number(button.dataset.page);
    renderPage(target, target > pageIndex ? 1 : -1, { manual:true });
    closeContents();
  }));
}

function openContents() { $("#contents").inert=false; $("#contents").classList.add("is-open"); $("#contents").setAttribute("aria-hidden","false"); $("#contents-button").setAttribute("aria-expanded","true"); $("#contents-close").focus(); }
function closeContents() { $("#contents").classList.remove("is-open"); $("#contents").setAttribute("aria-hidden","true"); $("#contents").inert=true; $("#contents-button").setAttribute("aria-expanded","false"); $("#contents-button").focus(); }

$("#previous-page").addEventListener("click", () => turn(-1));
$("#next-page").addEventListener("click", () => turn(1));
$("#audio-previous").addEventListener("click", () => turn(-1));
$("#audio-next").addEventListener("click", () => turn(1));
$("#play").addEventListener("click", togglePlayback);
$("#follow").addEventListener("click", () => { setFollowing(!followAudio); if (followAudio) syncPageToAudio(); });
$("#contents-button").addEventListener("click", openContents);
$("#contents-close").addEventListener("click", closeContents);
$("#seek").addEventListener("input", (event) => { if (audio.duration) { setFollowing(true); audio.currentTime=Number(event.target.value)/100*audio.duration; syncPageToAudio(); } });

audio.addEventListener("loadedmetadata", () => { $("#duration").textContent=formatTime(audio.duration); $(".flow-audio-bar").classList.remove("is-loading"); if (pendingPlayback) { pendingPlayback=false; audio.play().catch(()=>{}); } });
audio.addEventListener("play", () => { $("#play").classList.add("is-playing"); $("#play").setAttribute("aria-label","Gera hlé"); $(".flow-audio-bar").classList.add("is-playing"); });
audio.addEventListener("pause", () => { $("#play").classList.remove("is-playing"); $("#play").setAttribute("aria-label","Spila"); $(".flow-audio-bar").classList.remove("is-playing"); });
audio.addEventListener("timeupdate", () => { $("#elapsed").textContent=formatTime(audio.currentTime); $("#seek").value=audio.duration ? String(audio.currentTime/audio.duration*100) : "0"; syncPageToAudio(); });
audio.addEventListener("ended", () => {
  const current = pages[pageIndex];
  const nextTrackTitle = pages.find((page) => page.globalIndex > pageIndex && page.key !== current.key);
  if (nextTrackTitle) { setFollowing(true); renderPage(nextTrackTitle.globalIndex, 1, { keepPlaying:true }); }
});
audio.addEventListener("error", showAudioError);

let pointerStart = null;
pageElement.addEventListener("pointerdown", (event) => { if (event.target.closest("button")) return; pointerStart=event.clientX; });
pageElement.addEventListener("pointerup", (event) => { if (pointerStart===null) return; const distance=event.clientX-pointerStart; pointerStart=null; if (Math.abs(distance)>40) turn(distance<0?1:-1); });
document.addEventListener("keydown", (event) => {
  if (event.key==="ArrowLeft") { event.preventDefault(); turn(-1); }
  if (event.key==="ArrowRight") { event.preventDefault(); turn(1); }
  if (event.key==="Escape" && $("#contents").classList.contains("is-open")) closeContents();
  if (event.code==="Space" && !["BUTTON","INPUT"].includes(document.activeElement.tagName)) { event.preventDefault(); togglePlayback(); }
});

async function initialise() {
  manuscript=await loadManuscript("./content/manuscript.txt");
  pages=buildPages();
  renderContents();
  renderPage(0);
}

initialise().catch((error) => { console.error(error); $("#track-title").textContent="Ekki tókst að lesa handritið"; });
