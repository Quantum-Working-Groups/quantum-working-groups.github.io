/**
 * Cloud outlines around groups of points on a log-log chart.
 *
 * Port of `cloud_polygons` from the algorithm_cloud Python project (numpy /
 * scipy / contourpy). The two filters reproduce scipy.ndimage defaults so the
 * outlines match the Python output: `gaussianBlur` = gaussian_filter
 * (mode="reflect", truncate=4) and `distanceTransform` = distance_transform_edt.
 * Runs at build time only; pure TypeScript, no Node APIs.
 */
import { Delaunay } from "d3-delaunay";
import { contours } from "d3-contour";

export type Polygon = [number, number][];

/** A 2D field stored row-major: value(row, col) = data[row * cols + col]. */
interface Grid {
  rows: number;
  cols: number;
  data: Float64Array;
}

// --------------------------------------------------------------- filters

/** Normalized 1D Gaussian kernel, cut off at `truncate` standard deviations. */
function gaussianKernel(sigma: number, truncate = 4): Float64Array {
  const radius = Math.round(truncate * sigma);
  const k = new Float64Array(2 * radius + 1);
  let sum = 0;
  for (let i = -radius; i <= radius; i++) {
    const v = Math.exp(-0.5 * (i / sigma) ** 2);
    k[i + radius] = v;
    sum += v;
  }
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  return k;
}

/** scipy "reflect" boundary: d c b a | a b c d | d c b a (edge repeated). */
function reflect(i: number, n: number): number {
  if (n === 1) return 0;
  const period = 2 * n;
  let j = ((i % period) + period) % period;
  if (j >= n) j = period - 1 - j;
  return j;
}

function convolve1d(src: Grid, kernel: Float64Array, axis: 0 | 1): Grid {
  const { rows, cols } = src;
  const out = new Float64Array(rows * cols);
  const r = (kernel.length - 1) / 2;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let acc = 0;
      for (let k = -r; k <= r; k++) {
        const v =
          axis === 1
            ? src.data[row * cols + reflect(col + k, cols)]
            : src.data[reflect(row + k, rows) * cols + col];
        acc += kernel[k + r] * v;
      }
      out[row * cols + col] = acc;
    }
  }
  return { rows, cols, data: out };
}

/** Separable Gaussian blur; sigma given per axis as [rows, cols], in pixels. */
export function gaussianBlur(src: Grid, sigma: [number, number]): Grid {
  let g = src;
  if (sigma[0] > 0) g = convolve1d(g, gaussianKernel(sigma[0]), 0);
  if (sigma[1] > 0) g = convolve1d(g, gaussianKernel(sigma[1]), 1);
  return g;
}

/**
 * 1D squared Euclidean distance transform (Felzenszwalb & Huttenlocher).
 * `f` holds 0 at features and Infinity elsewhere; `w` is the sample spacing.
 */
function edt1d(f: Float64Array, w: number): Float64Array {
  // Lower envelope of parabolas y = (x - p)^2 + f[p], one per feature sample,
  // in physical units (sample q sits at x = q * w). Only finite f[q] count.
  const n = f.length;
  const d = new Float64Array(n);
  const v = new Int32Array(n); // envelope parabola positions
  const z = new Float64Array(n + 1); // boundaries between them
  const x = (q: number) => q * w;
  // where parabolas from samples p < q intersect
  const meet = (p: number, q: number) =>
    (f[q] + x(q) ** 2 - (f[p] + x(p) ** 2)) / (2 * (x(q) - x(p)));
  let k = -1;
  for (let q = 0; q < n; q++) {
    if (f[q] === Infinity) continue;
    if (k < 0) {
      k = 0;
      v[0] = q;
      z[0] = -Infinity;
      z[1] = Infinity;
      continue;
    }
    let s = meet(v[k], q);
    // drop envelope parabolas the new one hides entirely
    while (k >= 0 && s <= z[k]) {
      k--;
      if (k >= 0) s = meet(v[k], q);
    }
    k++;
    v[k] = q;
    z[k] = k === 0 ? -Infinity : s;
    z[k + 1] = Infinity;
  }
  if (k < 0) {
    d.fill(Infinity);
    return d;
  }
  let j = 0;
  for (let q = 0; q < n; q++) {
    while (z[j + 1] < x(q)) j++;
    d[q] = (x(q) - x(v[j])) ** 2 + f[v[j]];
  }
  return d;
}

/**
 * Exact Euclidean distance from each cell to the nearest `false` cell, with
 * per-axis spacing [rows, cols] (scipy's distance_transform_edt `sampling`).
 */
export function distanceTransform(
  mask: boolean[] | Uint8Array,
  rows: number,
  cols: number,
  sampling: [number, number],
): Grid {
  const sq = new Float64Array(rows * cols);
  for (let i = 0; i < sq.length; i++) sq[i] = mask[i] ? Infinity : 0;
  const col = new Float64Array(rows);
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) col[r] = sq[r * cols + c];
    const d = edt1d(col, sampling[0]);
    for (let r = 0; r < rows; r++) sq[r * cols + c] = d[r];
  }
  const row = new Float64Array(cols);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) row[c] = sq[r * cols + c];
    const d = edt1d(row, sampling[1]);
    for (let c = 0; c < cols; c++) sq[r * cols + c] = d[c];
  }
  for (let i = 0; i < sq.length; i++) sq[i] = Math.sqrt(sq[i]);
  return { rows, cols, data: sq };
}

// --------------------------------------------------------------- joining

/**
 * Pick Delaunay triangles, shortest-longest-edge first, until every point is
 * in one connected piece: the smallest "shrink-wrap" that joins the area, so
 * gaps fill with broad triangles instead of thin bridges.
 */
function connectingTriangles(pts: [number, number][], triangles: Uint32Array): number[] {
  const parent = pts.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const dist = (a: number, b: number) => Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]);
  const n = triangles.length / 3;
  const order = Array.from({ length: n }, (_, k) => k);
  const longest = order.map((k) => {
    const [a, b, c] = [triangles[3 * k], triangles[3 * k + 1], triangles[3 * k + 2]];
    return Math.max(dist(a, b), dist(b, c), dist(c, a));
  });
  order.sort((p, q) => longest[p] - longest[q] || p - q);
  const chosen: number[] = [];
  let groups = pts.length;
  for (const k of order) {
    if (groups === 1) break;
    chosen.push(k);
    for (const i of [triangles[3 * k + 1], triangles[3 * k + 2]]) {
      const ri = find(i);
      const root = find(triangles[3 * k]);
      if (ri !== root) {
        parent[ri] = root;
        groups--;
      }
    }
  }
  return chosen;
}

/** Rasterize triangles into a mask over the grid (point-in-triangle per cell). */
function rasterTriangles(
  pts: [number, number][],
  triangles: Uint32Array,
  chosen: number[],
  gx: Float64Array,
  gy: Float64Array,
): Uint8Array {
  const rows = gy.length;
  const cols = gx.length;
  const mask = new Uint8Array(rows * cols);
  for (const k of chosen) {
    const [a, b, c] = [pts[triangles[3 * k]], pts[triangles[3 * k + 1]], pts[triangles[3 * k + 2]]];
    const x0 = Math.min(a[0], b[0], c[0]);
    const x1 = Math.max(a[0], b[0], c[0]);
    const y0 = Math.min(a[1], b[1], c[1]);
    const y1 = Math.max(a[1], b[1], c[1]);
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
    if (area === 0) continue;
    for (let r = 0; r < rows; r++) {
      const y = gy[r];
      if (y < y0 || y > y1) continue;
      for (let col = 0; col < cols; col++) {
        const x = gx[col];
        if (x < x0 || x > x1) continue;
        // barycentric signs; inclusive edges, like scipy's find_simplex
        const w0 = ((b[0] - x) * (c[1] - y) - (c[0] - x) * (b[1] - y)) / area;
        const w1 = ((c[0] - x) * (a[1] - y) - (a[0] - x) * (c[1] - y)) / area;
        const w2 = 1 - w0 - w1;
        const eps = -1e-12;
        if (w0 >= eps && w1 >= eps && w2 >= eps) mask[r * cols + col] = 1;
      }
    }
  }
  return mask;
}

// --------------------------------------------------------------- outlines

export interface CloudOptions {
  xRange: [number, number];
  yRange: [number, number];
  sigma: number;
  level: number;
  connect?: boolean;
  smooth?: number;
  grid?: number;
  /** Per-point flag: draw only these, but keep joining triangles from all. */
  active?: boolean[];
}

/**
 * Outline soft clouds around points given in log10 units. Returns closed
 * polygons in log10 units. See the module comment and the Python original for
 * the method; behaviour (including `active`) matches it.
 */
export function cloudPolygons(xs: number[], ys: number[], opts: CloudOptions): Polygon[] {
  const { xRange, yRange, sigma, connect = false, smooth = 0.6, grid = 300 } = opts;
  if (xs.length === 0) return [];
  const active = opts.active ?? xs.map(() => true);
  if (!active.some(Boolean)) return [];

  const xspan = xRange[1] - xRange[0];
  const yspan = yRange[1] - yRange[0];
  const pad = 4 * sigma;
  const lin = (lo: number, hi: number) =>
    Float64Array.from({ length: grid }, (_, i) => lo + ((hi - lo) * i) / (grid - 1));
  const gx = lin(xRange[0] - pad * xspan, xRange[1] + pad * xspan);
  const gy = lin(yRange[0] - pad * yspan, yRange[1] + pad * yspan);
  const U = gx.map((x) => x / xspan);
  const V = gy.map((y) => y / yspan);
  const pts: [number, number][] = xs.map((x, i) => [x / xspan, ys[i] / yspan]);

  const rows = grid;
  const cols = grid;
  let field: Grid = { rows, cols, data: new Float64Array(rows * cols) };
  for (let i = 0; i < pts.length; i++) {
    if (!active[i]) continue;
    const [u, v] = pts[i];
    for (let r = 0; r < rows; r++) {
      const dv = (V[r] - v) ** 2;
      for (let c = 0; c < cols; c++) {
        field.data[r * cols + c] += Math.exp(-((U[c] - u) ** 2 + dv) / (2 * sigma ** 2));
      }
    }
  }

  if (connect) {
    // Duplicate coordinates are left out of every Delaunay triangle, which
    // would stop the joining step finishing. Triangulate unique positions.
    const key = (p: [number, number]) => `${p[0].toFixed(9)},${p[1].toFixed(9)}`;
    const index = new Map<string, number>();
    const uniq: [number, number][] = [];
    const uactive: boolean[] = [];
    pts.forEach((p, i) => {
      const k = key(p);
      let j = index.get(k);
      if (j === undefined) {
        j = uniq.length;
        index.set(k, j);
        uniq.push(p);
        uactive.push(false);
      }
      uactive[j] ||= active[i];
    });
    if (uniq.length >= 3) {
      const tri = Delaunay.from(uniq).triangles;
      // Delaunay returns no triangles for collinear points; plain bumps remain.
      const chosen = connectingTriangles(uniq, tri).filter(
        (k) => uactive[tri[3 * k]] && uactive[tri[3 * k + 1]] && uactive[tri[3 * k + 2]],
      );
      if (chosen.length) {
        const mask = rasterTriangles(uniq, tri, chosen, U, V);
        // Solid inside the triangles, Gaussian falloff outside them.
        const inv = mask.map((m) => (m ? 0 : 1));
        const dist = distanceTransform(inv, rows, cols, [V[1] - V[0], U[1] - U[0]]);
        const s2 = 2 * (0.6 * sigma) ** 2;
        for (let i = 0; i < field.data.length; i++) {
          field.data[i] = Math.max(field.data[i], Math.exp(-(dist.data[i] ** 2) / s2));
        }
      }
    }
  }

  let level = opts.level;
  if (smooth > 0) {
    // Blur the thresholded region and re-threshold at 0.5: rounds the
    // creases left where the bump field and triangle fill meet.
    const region: Grid = {
      rows,
      cols,
      data: field.data.map((v) => (v >= level ? 1 : 0)),
    };
    const px: [number, number] = [V[1] - V[0], U[1] - U[0]];
    field = gaussianBlur(region, [(smooth * sigma) / px[0], (smooth * sigma) / px[1]]);
    level = 0.5;
  }

  // d3-contour works in grid-index space with cell centers at i + 0.5; map
  // back to data coordinates so cell (r, c) sits exactly at (gx[c], gy[r]).
  const multi = contours().size([cols, rows]).thresholds([level])(Array.from(field.data))[0];
  const toX = (i: number) => gx[0] + ((i - 0.5) * (gx[cols - 1] - gx[0])) / (cols - 1);
  const toY = (j: number) => gy[0] + ((j - 0.5) * (gy[rows - 1] - gy[0])) / (rows - 1);
  const polys: Polygon[] = [];
  for (const shape of multi.coordinates) {
    const ring = shape[0]; // outer ring; clouds have no holes we need to draw
    if (ring.length > 3) polys.push(ring.map(([i, j]) => [toX(i), toY(j)] as [number, number]));
  }
  return polys;
}
