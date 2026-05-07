"use client";

import { motion } from "motion/react";

// ---------------------------------------------------------------------------
// Keyframes
//
// Each keyframe is a markdown-style table of cells. Each non-empty cell is a
// circle id (1..36) positioned at that (row, col). Circles keep their identity
// across keyframes — circle 1 in KF1 is the same circle as circle 1 in KF2.
// The grid is 9 cols × 9 rows; the SVG viewBox is sized from the max bounds so
// no circle is ever clipped.
//
// To customize the animation, edit the four strings below. The parser is
// tolerant of extra whitespace; each row must have the same number of `|`
// separators. Use any non-empty integer to place a circle at that cell.
// ---------------------------------------------------------------------------

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
  |    |    |    |    |    |    |   | 29 | 30 |
  |    | 25 |    | 27 | 28 |    |   | 35 | 36 |
  | 31 | 32 |    | 33 | 34 |    |   |    |    |
  `,
] as const;

// Animation timing within one loop. Each entry is the normalized time at which
// its keyframe is reached; the last repeats KF1 so the loop closes cleanly.
const KEYFRAME_TIMES = [0, 0.25, 0.7, 1];
const CYCLE_SECONDS = 8;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const STEP = 89.474;
const RADIUS = STEP / 2;
const STROKE_WIDTH = 1.5;

type Cell = readonly [row: number, col: number];

/** Parse one markdown-table keyframe into a map of circle id → (row, col). */
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

/** For each circle id, its cell (row, col) at every keyframe. */
const TRACKS: ReadonlyArray<{ id: number; cells: Cell[] }> = CIRCLE_IDS.map(
  (id) => ({
    id,
    cells: PARSED.map((kf) => {
      const cell = kf.get(id);
      if (!cell) {
        throw new Error(`Circle ${id} is missing from a keyframe`);
      }
      return cell;
    }),
  }),
);

// ViewBox sized from the actual min/max cell bounds across all keyframes, plus
// one radius of padding (+ half a stroke) on every side so circles and their
// strokes are never clipped.
const allRows = TRACKS.flatMap((t) => t.cells.map((c) => c[0]));
const allCols = TRACKS.flatMap((t) => t.cells.map((c) => c[1]));
const MIN_ROW = Math.min(...allRows);
const MAX_ROW = Math.max(...allRows);
const MIN_COL = Math.min(...allCols);
const MAX_COL = Math.max(...allCols);
const PAD = RADIUS + STROKE_WIDTH;
const VIEWBOX_W = (MAX_COL - MIN_COL) * STEP + 2 * PAD;
const VIEWBOX_H = (MAX_ROW - MIN_ROW) * STEP + 2 * PAD;

const cellX = (col: number) => PAD + (col - MIN_COL) * STEP;
const cellY = (row: number) => PAD + (row - MIN_ROW) * STEP;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = {
  width?: number;
  height?: number;
  className?: string;
};

export function HeroDotGrid({ width, height, className }: Props) {
  const renderHeight = height ?? 502;
  const renderWidth = width ?? Math.round((VIEWBOX_W / VIEWBOX_H) * renderHeight);

  return (
    <svg
      width={renderWidth}
      height={renderHeight}
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="heroDotGridStroke"
          x1="0"
          y1="0"
          x2="500"
          y2="500"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.122645" stopColor="#08BDBA" />
          <stop offset="1" stopColor="#005D5D" />
        </linearGradient>
      </defs>
      {TRACKS.map(({ id, cells }) => {
        const [r0, c0] = cells[0];
        const x0 = cellX(c0);
        const y0 = cellY(r0);
        const xs = cells.map(([, c]) => cellX(c) - x0);
        const ys = cells.map(([r]) => cellY(r) - y0);

        return (
          <motion.circle
            key={id}
            cx={x0}
            cy={y0}
            r={RADIUS}
            stroke="url(#heroDotGridStroke)"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            initial={{ x: 0, y: 0 }}
            animate={{ x: xs, y: ys }}
            transition={{
              duration: CYCLE_SECONDS,
              times: KEYFRAME_TIMES,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: "easeInOut",
            }}
          />
        );
      })}
    </svg>
  );
}
