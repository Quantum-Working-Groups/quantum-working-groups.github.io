import type { ReactNode } from "react";
import type { AreaConfig, MarkerShape } from "@/lib/resource-estimates/config";
import { CHART } from "@/lib/resource-estimates/config";
import type { ChartData, Cloud, Point } from "@/lib/resource-estimates/data";

// Chart geometry in SVG user units; the SVG scales to its container.
export const W = 960;
export const H = 560;
const M = { top: 16, right: 24, bottom: 56, left: 72 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;
// Rounded because Math.log10 can differ in the last digits between Node and the browser,
// which makes the server-rendered SVG attributes fail to match on hydration.
const round = (v: number) => Math.round(v * 100) / 100;

function hexToRgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function sci(v: number) {
  const e = Math.floor(Math.log10(v));
  const m = v / 10 ** e;
  return Math.abs(m - 1) < 1e-9 ? `10^${e}` : `${m.toPrecision(2)}×10^${e}`;
}

export function Marker({
  shape,
  x,
  y,
  r,
  fill,
  stroke,
}: {
  shape: MarkerShape;
  x: number;
  y: number;
  r: number;
  fill: string;
  stroke: string;
}) {
  const common = { fill, stroke, strokeWidth: 1.5 };
  switch (shape) {
    case "circle":
      return <circle cx={x} cy={y} r={r} {...common} />;
    case "square":
      return <rect x={x - r * 0.9} y={y - r * 0.9} width={r * 1.8} height={r * 1.8} {...common} />;
    case "diamond":
      return (
        <path
          d={`M${x} ${y - r * 1.25}L${x + r * 1.25} ${y}L${x} ${y + r * 1.25}L${x - r * 1.25} ${y}Z`}
          {...common}
        />
      );
    case "triangle-up":
      return (
        <path
          d={`M${x} ${y - r * 1.2}L${x + r * 1.1} ${y + r * 0.8}L${x - r * 1.1} ${y + r * 0.8}Z`}
          {...common}
        />
      );
    case "triangle-right":
      return (
        <path
          d={`M${x + r * 1.2} ${y}L${x - r * 0.8} ${y - r * 1.1}L${x - r * 0.8} ${y + r * 1.1}Z`}
          {...common}
        />
      );
  }
}

function Superscript({ exp }: { exp: number }) {
  return (
    <>
      10
      <tspan dy="-0.55em" fontSize="0.72em">
        {exp}
      </tspan>
    </>
  );
}

export interface PlotPoint {
  p: Point;
  index: number;
  x: number;
  y: number;
  area: AreaConfig;
  /** True for points published in the selected year. */
  isNew: boolean;
}

interface ChartPlotProps {
  data: Pick<ChartData, "areas" | "xRange" | "yRange">;
  clouds: Cloud[];
  points: Point[];
  hidden?: Set<string>;
  year?: number | null;
  clipId: string;
  label: string;
  /** Static picture: larger labels, fewer ticks, no year watermark or interaction. */
  readOnly?: boolean;
  /** Replaces the plain marker, for links and hover handlers. */
  renderPoint?: (point: PlotPoint) => ReactNode;
}

/** The plot itself. It has no state, so server components can render it too. */
export function ChartPlot({
  data,
  clouds,
  points,
  hidden,
  year = null,
  clipId,
  label,
  readOnly = false,
  renderPoint,
}: ChartPlotProps) {
  const [X0, X1] = data.xRange;
  const [Y0, Y1] = data.yRange;
  const sx = (log: number) => round(M.left + ((log - X0) / (X1 - X0)) * PW);
  const sy = (log: number) => round(M.top + PH - ((log - Y0) / (Y1 - Y0)) * PH);
  const byArea = new Map(data.areas.map((a) => [a.match, a]));
  const region = CHART.region;
  const tickStep = readOnly ? 2 : 1;
  const xDecades = Array.from({ length: X1 - X0 + 1 }, (_, i) => X0 + i);
  const yDecades = Array.from(
    { length: Math.floor(Y1) - Math.ceil(Y0) + 1 },
    (_, i) => Math.ceil(Y0) + i,
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto font-sans"
      role={readOnly ? "img" : "group"}
      aria-label={label}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={M.left} y={M.top} width={PW} height={PH} />
        </clipPath>
      </defs>

      {/* out-of-scope shading */}
      <g fill="#f4f4f4">
        <rect x={M.left} y={M.top} width={sx(Math.log10(region.minGates)) - M.left} height={PH} />
        <rect
          x={sx(Math.log10(region.minGates))}
          y={sy(Math.log10(region.minQubits))}
          width={M.left + PW - sx(Math.log10(region.minGates))}
          height={M.top + PH - sy(Math.log10(region.minQubits))}
        />
      </g>

      {/* grid + ticks */}
      <g stroke="#e0e0e0" strokeWidth={1}>
        {xDecades.map((e) => (
          <line key={`gx${e}`} x1={sx(e)} x2={sx(e)} y1={M.top} y2={M.top + PH} />
        ))}
        {yDecades.map((e) => (
          <line key={`gy${e}`} x1={M.left} x2={M.left + PW} y1={sy(e)} y2={sy(e)} />
        ))}
      </g>
      <g fontSize={readOnly ? 22 : 14} fill="#525252">
        {xDecades
          .filter((e) => (e - X0) % tickStep === 0)
          .map((e) => (
            <text
              key={`tx${e}`}
              x={sx(e)}
              y={M.top + PH + (readOnly ? 26 : 24)}
              textAnchor="middle"
            >
              <Superscript exp={e} />
            </text>
          ))}
        {yDecades
          .filter((e) => (e - Math.ceil(Y0)) % tickStep === 0)
          .map((e) => (
            <text key={`ty${e}`} x={M.left - 10} y={sy(e) + 5} textAnchor="end">
              <Superscript exp={e} />
            </text>
          ))}
      </g>
      <text
        x={M.left + PW / 2}
        y={H - (readOnly ? 4 : 8)}
        textAnchor="middle"
        fontSize={readOnly ? 22 : 16}
        fill="#161616"
      >
        Operations
      </text>
      <text
        transform={`translate(${readOnly ? 16 : 18} ${M.top + PH / 2}) rotate(-90)`}
        textAnchor="middle"
        fontSize={readOnly ? 22 : 16}
        fill="#161616"
      >
        Qubits
      </text>

      <g clipPath={`url(#${clipId})`}>
        {/* clouds */}
        {clouds.map((c) => {
          const a = byArea.get(c.area);
          if (!a || hidden?.has(c.area)) return null;
          return c.polygons.map((poly, i) => (
            <path
              key={`${c.area}-${i}`}
              d={`M${poly.map(([x, y]) => `${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`).join("L")}Z`}
              fill={hexToRgba(a.color, a.cloudOpacity ?? CHART.cloudOpacity)}
              stroke={hexToRgba(a.color, 0.85)}
              strokeWidth={1.2}
              strokeDasharray="5 4"
            />
          ));
        })}

        {/* dotted out-of-scope boundary */}
        <path
          d={`M${M.left + PW} ${sy(Math.log10(region.minQubits))}H${sx(Math.log10(region.minGates))}V${M.top}`}
          fill="none"
          stroke="#161616"
          strokeWidth={1.5}
          strokeDasharray="2 3"
        />

        {/* points */}
        {points.map((p, index) => {
          const area = byArea.get(p.area)!;
          const x = sx(Math.log10(p.gates));
          const y = sy(Math.log10(p.qubits));
          if (renderPoint) {
            return renderPoint({ p, index, x, y, area, isNew: year !== null && p.year === year });
          }
          return (
            <Marker
              key={`${p.reference}-${p.problem}-${index}`}
              shape={area.shape}
              x={x}
              y={y}
              r={readOnly ? 8 : 6}
              fill={area.color}
              stroke="#ffffff"
            />
          );
        })}
      </g>

      <rect
        x={M.left}
        y={M.top}
        width={PW}
        height={PH}
        fill="none"
        stroke="#161616"
        strokeWidth={1}
      />

      {!readOnly && year !== null && (
        <text
          x={M.left + PW - 12}
          y={M.top + PH - 14}
          textAnchor="end"
          fontSize={56}
          fill="rgba(22,22,22,0.15)"
          className="font-light tabular-nums"
        >
          {year}
        </text>
      )}
    </svg>
  );
}
