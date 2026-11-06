/**
 * Build-time loader for data/resource-estimates/*.yaml. Validates every file
 * and throws with the file name on any problem, so a bad edit fails
 * `npm run build` with a message pointing at what to fix (same convention as
 * src/lib/working-groups.ts).
 */
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { PaperSchema } from "./schema";
import { arxivId, idFromNumber, parseQuantity, referenceUrl } from "./parse";
import { AREAS, CHART, UNCONFIGURED_COLOR, type AreaConfig } from "./config";
import { cloudPolygons, type Polygon } from "./clouds";

export interface Point {
  area: string;
  topic: string;
  problem: string;
  qubits: number;
  qubitsText: string;
  gates: number;
  gateType: string;
  reference: string;
  url: string | null;
  year: number;
  comments: string;
}

export interface Cloud {
  area: string;
  polygons: Polygon[]; // log10 units
}

export interface ChartData {
  points: Point[];
  /** Estimates not plotted, with the reason. */
  skipped: string[];
  areas: (AreaConfig & { count: number })[];
  years: number[];
  /** Clouds for "all years", then one entry per year in `years`. */
  clouds: { all: Cloud[]; byYear: Record<number, Cloud[]> };
}

const DATA_DIR = path.join(process.cwd(), "data", "resource-estimates");

function fail(file: string, msg: string): never {
  throw new Error(`data/resource-estimates/${file}: ${msg}`);
}

export function loadPoints(): { points: Point[]; skipped: string[] } {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".yaml"))
    .sort();
  const points: Point[] = [];
  const skipped: string[] = [];
  const seen = new Map<string, string>();
  for (const file of files) {
    const parsed = PaperSchema.safeParse(
      yaml.load(fs.readFileSync(path.join(DATA_DIR, file), "utf8")),
    );
    if (!parsed.success) {
      const issues = parsed.error.issues.map(
        (i) => `${i.path.join("/") || "(top level)"}: ${i.message}`,
      );
      fail(file, issues.join("; "));
    }
    const doc = parsed.data;
    if (doc.status === "candidate") continue; // unverified: not published yet
    let ref = String(doc.reference);
    if (typeof doc.reference === "number") {
      const id = idFromNumber(doc.reference);
      const stem = file.replace(/\.yaml$/, "");
      if (!id || (id !== stem && !stem.startsWith(id)))
        fail(file, `reference: quote the arXiv ID, e.g. reference: '${id ?? stem}'`);
      ref = id;
    }
    const url = doc.url ?? referenceUrl(ref);
    const key = arxivId(ref) ?? arxivId(url ?? "") ?? ref.toLowerCase();
    if (seen.has(key)) fail(file, `same paper as ${seen.get(key)} (${key}); merge them`);
    seen.set(key, file);
    const stem = file.replace(/\.yaml$/, "");
    const aid = arxivId(ref) ?? arxivId(url ?? "");
    if (aid && stem !== aid && !stem.startsWith(aid))
      fail(file, `file name should match the arXiv ID: rename to ${aid}.yaml`);

    doc.estimates.forEach((est, i) => {
      const q = parseQuantity(est.qubits);
      const g = parseQuantity(est.gates);
      if (!q)
        fail(file, `estimates/${i}/qubits: ${JSON.stringify(est.qubits)} is not a positive number`);
      if (!g)
        fail(file, `estimates/${i}/gates: ${JSON.stringify(est.gates)} is not a positive number`);
      const shownRef = est.location ? `${ref} (${est.location})` : ref;
      if (est.include === false) {
        skipped.push(`${shownRef}: ${est.problem} (marked include: false)`);
        return;
      }
      points.push({
        area: est.area,
        topic: est.topic ?? "",
        problem: est.problem,
        qubits: q[0],
        qubitsText: q[1],
        gates: g[0],
        gateType: est.gate_type,
        reference: shownRef,
        url,
        year: doc.year,
        comments: est.comments ?? "",
      });
    });
  }
  return { points, skipped };
}

function cloudsFor(points: Point[], areas: AreaConfig[], upTo?: number): Cloud[] {
  return areas.map((a) => {
    const pts = points.filter((p) => p.area === a.match);
    return {
      area: a.match,
      polygons: cloudPolygons(
        pts.map((p) => Math.log10(p.gates)),
        pts.map((p) => Math.log10(p.qubits)),
        {
          xRange: CHART.xRange,
          yRange: CHART.yRange,
          sigma: CHART.cloudSigma,
          level: CHART.cloudLevel,
          smooth: CHART.cloudSmooth,
          connect: a.connect,
          // Shape from the full set so clouds only grow year to year.
          active: upTo === undefined ? undefined : pts.map((p) => p.year <= upTo),
        },
      ),
    };
  });
}

/** Perpendicular distance from p to segment a-b. */
function segDist(p: [number, number], a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2)) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

/** Douglas–Peucker: drop vertices that move the outline by less than tol. */
function simplify(poly: [number, number][], tol: number): [number, number][] {
  if (poly.length < 4) return poly;
  const keep = new Uint8Array(poly.length);
  keep[0] = keep[poly.length - 1] = 1;
  const stack: [number, number][] = [[0, poly.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop()!;
    let best = -1;
    let at = -1;
    for (let k = i + 1; k < j; k++) {
      const d = segDist(poly[k], poly[i], poly[j]);
      if (d > best) [best, at] = [d, k];
    }
    if (best > tol) {
      keep[at] = 1;
      stack.push([i, at], [at, j]);
    }
  }
  return poly.filter((_, k) => keep[k]);
}

/**
 * Shrink outlines for the page: simplify to ~0.25 px at the chart's drawn
 * size (invisible), then round to 1e-4 decades (~0.1 px).
 */
function compact(clouds: Cloud[]): Cloud[] {
  // the chart's plot area is ~860 px across ~10 decades; work in decades
  const tol = (0.25 * (CHART.xRange[1] - CHART.xRange[0])) / 860;
  const r = (v: number) => Math.round(v * 1e4) / 1e4;
  return clouds.map((c) => ({
    ...c,
    polygons: c.polygons.map((p) =>
      simplify(p, tol).map(([x, y]) => [r(x), r(y)] as [number, number]),
    ),
  }));
}

export function getChartData(): ChartData {
  const { points: all, skipped } = loadPoints();
  const points = all.filter((p) => p.gates <= CHART.maxGates);
  for (const p of all) {
    if (p.gates > CHART.maxGates)
      skipped.push(
        `${p.reference}: ${p.problem} (${p.gates.toExponential(1)} gates, above the chart's range)`,
      );
  }
  const known = new Set(AREAS.map((a) => a.match));
  const extra = [...new Set(points.map((p) => p.area))]
    .filter((a) => !known.has(a))
    .map((a): AreaConfig => ({ match: a, label: a, color: UNCONFIGURED_COLOR, shape: "circle" }));
  const areas = [...AREAS, ...extra].map((a) => ({
    ...a,
    count: points.filter((p) => p.area === a.match).length,
  }));
  const ys = points.map((p) => p.year);
  const years = ys.length
    ? Array.from({ length: Math.max(...ys) - Math.min(...ys) + 1 }, (_, i) => Math.min(...ys) + i)
    : [];
  const byYear: Record<number, Cloud[]> = {};
  for (const y of years) byYear[y] = compact(cloudsFor(points, areas, y));
  return {
    points,
    skipped,
    areas,
    years,
    clouds: { all: compact(cloudsFor(points, areas)), byYear },
  };
}
