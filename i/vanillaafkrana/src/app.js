import { books } from "./books.js";

const $ = (selector) => document.querySelector(selector);
const room = $("#room-space");
const roomView = $("#room-view");
const audio = $("#audio");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

let view = 0;
let openDoor = null;
let activeBook = null;
let activeChapter = -1;
let playThrough = false;
let pointerStart = null;
let dragged = false;
let journeyStep = 0;
const completedChapters = new Map();
const journeyColors = ["#df4d42", "#ef9b3d", "#f4d35e", "#83bd58", "#39a99b", "#4798d0", "#6f68c9", "#bd65a4"];

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[character]));

function chapterMarkup(chapter, index) {
  return `<li class="chapter" data-chapter="${index}"><button class="chapter-row" type="button" data-play-chapter="${index}" aria-label="Spila ${escapeHtml(chapter.title)}, skrá ${escapeHtml(chapter.fileName)}"><span>${String(index + 1).padStart(2, "0")}</span><span class="chapter-name"><strong>${escapeHtml(chapter.title)}</strong><em>${escapeHtml(chapter.fileName)}</em></span><i>▶</i></button></li>`;
}

function renderRoom() {
  room.innerHTML = books.map((book, index) => `
    <article class="wall wall-${index + 1}" style="--i:${index};--paper:${book.accent}" data-wall="${index}">
      <div class="wall-surface" aria-hidden="true"></div>
      <div class="door-frame"><div class="door" data-door="${index}">
        <button class="door-front" type="button" data-open="${index}" aria-label="Opna ${escapeHtml(book.title)}">
          <span class="door-code">D / ${book.number}</span><span class="door-mark">${book.number}</span><strong>${escapeHtml(book.title)}</strong>
          <small>${escapeHtml(book.subtitle)} · ${book.chapters.length} kaflar</small><i class="door-handle" aria-hidden="true"><b></b></i>
        </button>
        <section class="door-back" aria-label="Kaflar í ${escapeHtml(book.title)}" inert>
          <button class="close-menu" type="button" data-close="${index}" aria-label="Loka kaflalista">×</button>
          <button class="paper-heading" type="button" data-play-all="${index}" aria-label="Spila alla kafla í ${escapeHtml(book.title)}">
            <span>BÓK ${book.number}</span><strong>${escapeHtml(book.title)}</strong><small>ÝTTU HÉR TIL AÐ SPILA ALLT</small><i>▶</i>
          </button>
          <ol class="chapter-list">${book.chapters.map(chapterMarkup).join("")}</ol>
        </section>
      </div></div>
      <span class="wall-label" aria-hidden="true">SECTOR 0${index + 1}</span>
    </article>`).join("");

  room.querySelectorAll("[data-open]").forEach((button) => button.addEventListener("click", () => { if (!dragged) flipDoor(Number(button.dataset.open)); }));
  room.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", (event) => { event.stopPropagation(); closeMenu(Number(button.dataset.close)); }));
  room.querySelectorAll("[data-play-all]").forEach((button) => button.addEventListener("click", () => { selectBook(Number(button.dataset.playAll)); playThrough = true; playChapter(0); }));
  room.querySelectorAll("[data-play-chapter]").forEach((button) => button.addEventListener("click", () => {
    selectBook(Number(button.closest("[data-wall]").dataset.wall));
    playThrough = false;
    playChapter(Number(button.dataset.playChapter));
  }));
  updateView();
}

function selectBook(index) {
  if (activeBook !== books[index]) { activeBook = books[index]; activeChapter = -1; }
}

function flipDoor(index) {
  if (openDoor !== null && openDoor !== index) closeMenu(openDoor, false);
  view = index;
  openDoor = index;
  const door = room.querySelector(`[data-door="${index}"]`);
  door.querySelector(".door-back").inert = false;
  door.querySelector(".door-front").tabIndex = -1;
  door.classList.add("is-open");
  document.body.classList.add("menu-open");
  updateView();
  setTimeout(() => room.querySelector(`[data-close="${index}"]`)?.focus(), reducedMotion.matches ? 0 : 750);
}

function closeMenu(index, restoreFocus = true) {
  const door = room.querySelector(`[data-door="${index}"]`);
  door?.classList.remove("is-open");
  if (door) door.querySelector(".door-back").inert = true;
  if (openDoor === index) openDoor = null;
  document.body.classList.remove("menu-open");
  updateView();
  if (restoreFocus) room.querySelector(`[data-open="${index}"]`)?.focus();
}

function setView(next) {
  if (openDoor !== null) closeMenu(openDoor, false);
  view = (next % books.length + books.length) % books.length;
  updateView();
}

function updateView() {
  room.style.setProperty("--look", `${view * -120}deg`);
  document.querySelectorAll("[data-view]").forEach((button, index) => {
    button.classList.toggle("is-current", index === view);
    if (index === view) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
  room.querySelectorAll(".wall").forEach((wall, index) => {
    const front = index === view;
    wall.classList.toggle("is-front", front);
    wall.querySelector(".door-front").tabIndex = front && index !== openDoor ? 0 : -1;
  });
}

async function playChapter(index) {
  if (!activeBook || index < 0 || index >= activeBook.chapters.length) return;
  activeChapter = index;
  const chapter = activeBook.chapters[index];
  audio.src = new URL(chapter.file, import.meta.url).href;
  $("#now-title").textContent = `${activeBook.title} · ${chapter.title}`;
  updateActiveChapter();
  try { await audio.play(); } catch (error) { if (error.name !== "AbortError") showAudioError(); }
}

function updateActiveChapter() {
  room.querySelectorAll(".chapter").forEach((row) => {
    const wallIndex = Number(row.closest("[data-wall]").dataset.wall);
    const active = activeBook === books[wallIndex] && Number(row.dataset.chapter) === activeChapter;
    row.classList.toggle("is-active", active);
    const completionColor = completedChapters.get(`${wallIndex}-${row.dataset.chapter}`);
    row.classList.toggle("is-complete", Boolean(completionColor));
    if (completionColor) row.style.setProperty("--completed-color", completionColor);
    row.querySelector("i").textContent = active && !audio.paused ? "Ⅱ" : "▶";
  });
  $("#play-toggle").classList.toggle("is-playing", !audio.paused);
  $("#play-toggle").setAttribute("aria-label", audio.paused ? "Spila" : "Gera hlé");
  $("#player").classList.toggle("is-playing", !audio.paused);
}

function togglePlayback() {
  if (!activeBook) selectBook(view);
  if (activeChapter < 0) playChapter(0);
  else if (audio.paused) audio.play().catch(showAudioError);
  else audio.pause();
}

function moveChapter(amount) {
  if (!activeBook) selectBook(view);
  const next = activeChapter < 0 ? 0 : Math.min(Math.max(activeChapter + amount, 0), activeBook.chapters.length - 1);
  playThrough = false;
  playChapter(next);
}

function showAudioError() { $("#now-title").textContent = "Ekki tókst að opna hljóðskrá"; $("#player").classList.remove("is-playing"); }
function formatTime(seconds) { return Number.isFinite(seconds) ? `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}` : "00:00"; }
function completeCurrentChapter() {
  if (!activeBook || activeChapter < 0) return;
  const color = journeyColors[journeyStep % journeyColors.length];
  completedChapters.set(`${books.indexOf(activeBook)}-${activeChapter}`, color);
  journeyStep = (journeyStep + 1) % journeyColors.length;
  document.documentElement.style.setProperty("--journey", journeyColors[journeyStep]);
  document.documentElement.style.setProperty("--journey-rgb", hexToRgb(journeyColors[journeyStep]));
  updateActiveChapter();
}
function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return `${value >> 16}, ${(value >> 8) & 255}, ${value & 255}`;
}

$("#look-left").addEventListener("click", () => setView(view - 1));
$("#look-right").addEventListener("click", () => setView(view + 1));
document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => setView(Number(button.dataset.view))));
$("#play-toggle").addEventListener("click", togglePlayback);
$("#previous").addEventListener("click", () => moveChapter(-1));
$("#next").addEventListener("click", () => moveChapter(1));
$("#mute").addEventListener("click", () => { audio.muted = !audio.muted; $("#mute").textContent = audio.muted ? "MUTE" : "VOL"; });
audio.addEventListener("play", updateActiveChapter);
audio.addEventListener("pause", updateActiveChapter);
audio.addEventListener("ended", () => {
  completeCurrentChapter();
  if (playThrough && activeChapter < activeBook.chapters.length - 1) playChapter(activeChapter + 1);
  else { playThrough = false; updateActiveChapter(); }
});
audio.addEventListener("loadedmetadata", () => { $("#duration").textContent = formatTime(audio.duration); });
audio.addEventListener("timeupdate", () => { $("#current-time").textContent = formatTime(audio.currentTime); $("#seek").value = audio.duration ? String((audio.currentTime / audio.duration) * 100) : "0"; });
audio.addEventListener("error", showAudioError);
$("#seek").addEventListener("input", (event) => { if (audio.duration) audio.currentTime = (Number(event.target.value) / 100) * audio.duration; });

roomView.addEventListener("pointerdown", (event) => {
  if (event.target.closest(".door-back")) return;
  pointerStart = event.clientX; dragged = false; roomView.setPointerCapture(event.pointerId);
});
roomView.addEventListener("pointermove", (event) => {
  if (pointerStart === null) return;
  const distance = event.clientX - pointerStart;
  if (Math.abs(distance) > 12) dragged = true;
  room.style.setProperty("--drag", `${distance * .1}deg`);
});
roomView.addEventListener("pointerup", (event) => {
  if (pointerStart === null) return;
  const distance = event.clientX - pointerStart;
  room.style.setProperty("--drag", "0deg");
  if (Math.abs(distance) > 45) setView(view + (distance < 0 ? 1 : -1));
  pointerStart = null; setTimeout(() => { dragged = false; }, 0);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && openDoor !== null) closeMenu(openDoor);
  if (event.key === "ArrowLeft" && openDoor === null) setView(view - 1);
  if (event.key === "ArrowRight" && openDoor === null) setView(view + 1);
  if (event.key === "Enter" && openDoor === null) flipDoor(view);
  if (event.code === "Space" && !["INPUT", "BUTTON"].includes(document.activeElement.tagName)) { event.preventDefault(); togglePlayback(); }
});

renderRoom();
