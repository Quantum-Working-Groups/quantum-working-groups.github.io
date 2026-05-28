const KEYFRAMES = [
  // KF1 — rest (tight 6×6 block)
  `
  | |  |    |    |    |    |    |    | |
  | |  |    |    |    |    |    |    | |
  | |  | 1  | 2  | 3  | 4  | 5  | 6  | |
  | |  | 7  | 8  | 9  | 10 | 11 | 12 | |
  | |  | 13 | 14 | 15 | 16 | 17 | 18 | |
  | |  | 19 | 20 | 21 | 22 | 23 | 24 | |
  | |  | 25 | 26 | 27 | 28 | 29 | 30 | |
  | |  | 31 | 32 | 33 | 34 | 35 | 36 | |
  | |  |    |    |    |    |    |    | |
  `,
  // KF2
  `
  |    |    |    |    |    |    |    |    |    |
  |    | 1  | 2  | 3  | 4  |    | 5  | 6  |    |
  |    | 7  | 8  | 9  | 10 |    | 11 | 12 |    |
  |    |    |    |    |    |    |    |    |    |
  | 13 | 14 |    | 15 |    | 16 | 17 |    | 18 |
  | 19 | 20 |    | 21 |    | 22 | 23 |    | 24 |
  |    |    |    |    |    |    |    |    |    |
  |    | 25 | 26 | 27 |    | 28 |    | 29 | 30 |
  |    | 31 | 32 | 33 |    | 34 |    | 35 | 36 |
  `,
  // KF3
  `
  |    |    |    |    |    |    |    |    |    |
  |    | 1  | 2  | 3  | 4  |    |    | 5  | 6  |
  |    |    | 7  | 9  | 10 |    |    | 11 | 12 |
  |    |    |    |    |    |    |    |    |    |
  | 13 | 14 | 8  | 15 | 16 |    |    | 17 | 18 |
  | 19 | 20 | 26 | 21 | 22 |    |    | 23 | 24 |
  |    |    |    |    |    |    |    |    |    |
  |    |    | 25 | 27 |    | 28 |    | 29 | 30 |
  |    | 31 | 32 | 33 |    | 34 |    | 35 | 36 |
  `,
  // KF4
  `
  |    |    |    |    |    |    |   |    |    |
  |    | 1  | 2  |    | 3  | 4  |   |    |    |
  |    |    | 7  |    | 9  | 10 |   | 5  | 6  |
  |    |    |    |    |    |    |   | 11 | 12 |
  | 13 | 14 | 8  | 15 | 16 |    |   | 17 | 18 |
  | 19 | 20 | 26 | 21 | 22 |    |   | 23 | 24 |
  |    |    |    |    |    |   | 29 | 30 |
  |    | 25 |    | 27 | 28 |    |   | 35 | 36 |
  | 31 | 32 |    | 33 | 34 |    |   |    |    |
  `,
] as const;

export const KEYFRAME_TIMES = [0, 0.25, 0.7, 1];
export const CYCLE_SECONDS = 8;

export const STEP = 89.474;
export const RADIUS = STEP / 2;
export const STROKE_WIDTH = 1.5;

type Cell = readonly [row: number, col: number];

function parseKeyframe(table: string): Map<number, Cell> {
  const positions = new Map<number, Cell>();
  const rows = table
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));
  rows.forEach((line, r) => {
    const trimmed = line.replace(/^\|/, "").replace(/\|\s*$/, "");
    const cells = trimmed.split("|").map((c) => c.trim());
    cells.forEach((cell, c) => {
      if (!cell) return;
      const id = Number.parseInt(cell, 10);
      if (Number.isFinite(id)) positions.set(id, [r, c]);
    });
  });
  return positions;
}

const PARSED = KEYFRAMES.map(parseKeyframe);

const CIRCLE_IDS = Array.from(PARSED[0].keys()).sort((a, b) => a - b);

export const TRACKS: ReadonlyArray<{ id: number; cells: Cell[] }> = CIRCLE_IDS.map((id) => ({
  id,
  cells: PARSED.map((kf) => {
    const cell = kf.get(id);
    if (!cell) throw new Error(`Circle ${id} is missing from a keyframe`);
    return cell;
  }),
}));

const allRows = TRACKS.flatMap((t) => t.cells.map((c) => c[0]));
const allCols = TRACKS.flatMap((t) => t.cells.map((c) => c[1]));
const MIN_ROW = Math.min(...allRows);
const MAX_ROW = Math.max(...allRows);
const MIN_COL = Math.min(...allCols);
const MAX_COL = Math.max(...allCols);
const PAD = RADIUS + STROKE_WIDTH;

export const VIEWBOX_W = (MAX_COL - MIN_COL) * STEP + 2 * PAD;
export const VIEWBOX_H = (MAX_ROW - MIN_ROW) * STEP + 2 * PAD;

export const cellX = (col: number) => PAD + (col - MIN_COL) * STEP;
export const cellY = (row: number) => PAD + (row - MIN_ROW) * STEP;
