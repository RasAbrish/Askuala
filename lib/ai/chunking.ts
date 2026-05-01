/**
 * Splits text into roughly word-bounded chunks with overlap, so RAG retrieval
 * doesn't lose context that straddles chunk boundaries.
 */
export interface Chunk {
  content: string;
  page_number: number | null;
}

export function chunkPages(
  pages: { page_number: number; text: string }[],
  opts: { chunkSize?: number; overlap?: number } = {},
): Chunk[] {
  const chunkSize = opts.chunkSize ?? 800; // characters
  const overlap = opts.overlap ?? 120;
  const chunks: Chunk[] = [];

  for (const page of pages) {
    const cleaned = normalize(page.text);
    if (!cleaned) continue;

    let start = 0;
    while (start < cleaned.length) {
      const end = Math.min(start + chunkSize, cleaned.length);
      // Snap end back to the last whitespace so we don't cut words.
      const snap = end < cleaned.length ? cleaned.lastIndexOf(" ", end) : end;
      const cut = snap > start + chunkSize * 0.5 ? snap : end;
      const slice = cleaned.slice(start, cut).trim();
      if (slice.length > 60) {
        chunks.push({ content: slice, page_number: page.page_number });
      }
      if (cut === cleaned.length) break;
      start = Math.max(cut - overlap, cut);
    }
  }
  return chunks;
}

/**
 * Chunk a single block of text (no page boundaries). Used for pasted text
 * and OCR'd images where there's no meaningful pagination.
 */
export function chunkText(
  text: string,
  opts: { chunkSize?: number; overlap?: number } = {},
): Chunk[] {
  return chunkPages([{ page_number: 1, text }], opts);
}

function normalize(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Naive chapter detection from page texts. Looks for lines like
 * "Chapter 1", "CHAPTER 1", "UNIT 1" near the top of a page.
 * If no markers are found, returns a single "Full Textbook" chapter.
 */
export interface DetectedChapter {
  number: number;
  title: string;
  start_page: number;
  end_page: number;
}

export function detectChapters(
  pages: { page_number: number; text: string }[],
): DetectedChapter[] {
  const chapters: DetectedChapter[] = [];
  const re = /^\s*(?:CHAPTER|Chapter|UNIT|Unit)\s+(\d+)\b[:\.\-\s]*(.{0,80})/m;

  for (const page of pages) {
    const head = page.text.split("\n").slice(0, 10).join("\n");
    const m = head.match(re);
    if (m) {
      const number = parseInt(m[1], 10);
      const title = (m[2] || `Chapter ${number}`).trim() || `Chapter ${number}`;
      // Close out previous chapter
      if (chapters.length) {
        chapters[chapters.length - 1].end_page = page.page_number - 1;
      }
      chapters.push({
        number,
        title,
        start_page: page.page_number,
        end_page: page.page_number,
      });
    }
  }
  if (!chapters.length) return [];
  chapters[chapters.length - 1].end_page = pages[pages.length - 1].page_number;
  return chapters;
}
