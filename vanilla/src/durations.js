/** Rounded durations in seconds, indexed from Ker 3.m4a through Ker 100.m4a. */
const durations = [
  92, 314, 27, 87, 135, 28, 63, 40, 20, 22, 60, 33, 36, 26,
  11, 43, 0, 93, 61, 37, 45, 46, 40, 118, 18, 101, 12, 48,
  37, 67, 43, 36, 57, 31, 59, 40, 58, 10, 104, 35, 171, 29,
  22, 21, 28, 46, 125, 15, 37, 93, 21, 24, 86, 26, 26, 20,
  282, 72, 19, 44, 26, 19, 83, 26, 6, 13, 36, 105, 55, 24,
  37, 33, 17, 17, 47, 41, 40, 15, 29, 84, 22, 38, 152, 26,
  13, 56, 29, 8, 23, 26, 27, 20, 27, 8, 60, 55, 42, 6,
];

export function durationFor(fileName) {
  const match = fileName.match(/Ker (\d+)\.m4a/i);
  return match ? durations[Number(match[1]) - 3] ?? null : null;
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}
