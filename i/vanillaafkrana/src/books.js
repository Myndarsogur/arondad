/**
 * Bóka- og kaflagögn.
 * Breyttu `title` til að endurnefna bók eða kafla án þess að breyta hljóðskránni.
 * Breyttu `file` ef skrárnar eru síðar færðar eða endurnefndar.
 */
const AUDIO_FOLDER = "../hljod";

function chapters(firstFile, lastFile) {
  return Array.from({ length: lastFile - firstFile + 1 }, (_, index) => {
    const fileNumber = firstFile + index;
    return {
      id: `chapter-${fileNumber}`,
      title: `Kafli ${String(index + 1).padStart(2, "0")}`,
      fileName: `Ker ${fileNumber}.m4a`,
      file: `${AUDIO_FOLDER}/Ker ${fileNumber}.m4a`,
    };
  });
}

export const books = [
  {
    id: "book-1",
    number: "01",
    title: "Í leit að regnbogum",
    subtitle: "Fyrsta bindi",
    accent: "#e8dec5",
    chapters: chapters(3, 35),
  },
  {
    id: "book-2",
    number: "02",
    title: "Hafmeyjan rís",
    subtitle: "Annað bindi",
    accent: "#d8d2b9",
    chapters: chapters(36, 68),
  },
  {
    id: "book-3",
    number: "03",
    title: "Lýsið",
    subtitle: "Þriðja bindi",
    accent: "#ded0c3",
    chapters: chapters(69, 100),
  },
];
