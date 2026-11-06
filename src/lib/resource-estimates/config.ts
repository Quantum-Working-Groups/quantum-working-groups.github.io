/**
 * Chart settings. Ported from the algorithm_cloud project's config.toml.
 * Axis ranges are in log10 units.
 */

export type MarkerShape = "circle" | "triangle-up" | "square" | "triangle-right" | "diamond";

export interface AreaConfig {
  /** Value of `area` in the data files. */
  match: string;
  /** Legend label. */
  label: string;
  color: string;
  shape: MarkerShape;
  /** Merge all of the area's points into one blob instead of separate islands. */
  connect?: boolean;
  /** Overrides `CHART.cloudOpacity` for this area's cloud fill. */
  cloudOpacity?: number;
}

export const CHART = {
  xRange: [2, 12] as [number, number],
  yRange: [1, 5.3] as [number, number],
  /** Estimates with more gates than this are listed, not plotted. */
  maxGates: 1e12,
  /** Cloud bump radius, as a fraction of each axis span. */
  cloudSigma: 0.045,
  /** Contour level (0-1) of the summed bump field; lower = bigger clouds. */
  cloudLevel: 0.45,
  /** Corner rounding, relative to cloudSigma. 0 = off. */
  cloudSmooth: 0.6,
  cloudOpacity: 0.13,
  /** Shaded "out of scope" region: left of / below these bounds. */
  region: { minGates: 5e3, minQubits: 70 },
};

// Colors follow the original slide. Optimization is a darker shade of the
// slide's green so it reaches 3:1 contrast on white. Some pairs stay close
// (green vs olive, blue vs violet), so every area has its own marker shape and
// color is never the only cue.
export const AREAS: AreaConfig[] = [
  {
    match: "Hamiltonian Simulation",
    label: "Hamiltonian Simulation",
    color: "#a45293",
    shape: "circle",
    connect: true,
  },
  { match: "Optimization", label: "Optimization", color: "#839b37", shape: "triangle-up" },
  { match: "ML", label: "Machine Learning", color: "#6b6ece", shape: "square" },
  {
    match: "Differential Equations",
    label: "Differential Equations",
    color: "#63783c",
    shape: "triangle-right",
  },
  {
    match: "Cryptography",
    label: "Cryptography",
    color: "#6badd5",
    shape: "diamond",
    connect: true,
    cloudOpacity: 0.22,
  },
];

/** Color for areas found in the data but not configured above. */
export const UNCONFIGURED_COLOR = "#898781";
