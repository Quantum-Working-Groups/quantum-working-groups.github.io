"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { ChartData, Point } from "@/lib/resource-estimates/data";
import type { MarkerShape } from "@/lib/resource-estimates/config";
import { CHART } from "@/lib/resource-estimates/config";

// Chart geometry in SVG user units; the SVG scales to its container.
const W = 960;
const H = 560;
const M = { top: 16, right: 24, bottom: 56, left: 72 };
const PW = W - M.left - M.right;
const PH = H - M.top - M.bottom;
const [X0, X1] = CHART.xRange;
const [Y0, Y1] = CHART.yRange;
const sx = (log: number) => M.left + ((log - X0) / (X1 - X0)) * PW;
const sy = (log: number) => M.top + PH - ((log - Y0) / (Y1 - Y0)) * PH;

function hexToRgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function sci(v: number) {
  const e = Math.floor(Math.log10(v));
  const m = v / 10 ** e;
  return Math.abs(m - 1) < 1e-9 ? `10^${e}` : `${m.toPrecision(2)}×10^${e}`;
}

function Marker({
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

export function AlgorithmSpace({ data }: { data: ChartData }) {
  const { points, areas, years, clouds } = data;
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  // slider index: years.length means "all years"
  const [yearIdx, setYearIdx] = useState(years.length);
  const [playing, setPlaying] = useState(false);
  const [hover, setHover] = useState<{ p: Point; x: number; y: number; key: string } | null>(null);
  const uid = useId();
  const clipId = `${uid}-plot`;
  const tipId = `${uid}-tip`;

  const year = yearIdx >= years.length ? null : years[yearIdx];
  const cloudSet = year === null ? clouds.all : clouds.byYear[year];
  const shown = useMemo(
    () => points.filter((p) => !hidden.has(p.area) && (year === null || p.year <= year)),
    [points, hidden, year],
  );
  // A hovered point can vanish (year or area change) without firing
  // mouseleave/blur; derive visibility instead of clearing state in an effect.
  const tip = hover && shown.includes(hover.p) ? hover : null;

  // Advance one year per tick; the tick that reaches "All years" also stops
  // playback (in the timer callback, not in a state updater or an effect).
  useEffect(() => {
    if (!playing) return;
    let i = yearIdx;
    const t = setInterval(() => {
      i = Math.min(i + 1, years.length);
      setYearIdx(i);
      if (i >= years.length) setPlaying(false);
    }, 1200);
    return () => clearInterval(t);
    // yearIdx is only the starting point; re-running on every tick would reset the interval
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, years.length]);

  useEffect(() => {
    if (!hover) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setHover(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hover]);

  const toggle = (area: string) =>
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(area)) n.delete(area);
      else n.add(area);
      return n;
    });

  const byArea = new Map(areas.map((a) => [a.match, a]));
  const region = CHART.region;

  return (
    <div className="flex flex-col gap-6">
      {/* Year timeline */}
      {years.length > 1 && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-text-secondary">Published</span>
          <button
            type="button"
            onClick={() => {
              if (playing) return setPlaying(false);
              if (yearIdx >= years.length) setYearIdx(0);
              setPlaying(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle px-3 py-1 hover:bg-layer-01 transition-colors"
            aria-label={playing ? "Pause timeline" : "Play timeline"}
          >
            {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {playing ? "Pause" : "Play"}
          </button>
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <input
              type="range"
              min={0}
              max={years.length}
              step={1}
              value={yearIdx}
              onChange={(e) => {
                setPlaying(false);
                setYearIdx(Number(e.target.value));
              }}
              className="w-full accent-teal-70"
              aria-label="Show estimates published up to year"
              aria-valuetext={year === null ? "All years" : `Up to ${year}`}
            />
            {/* tick labels; every other year on narrow screens */}
            <div
              className="flex justify-between text-[11px] text-text-secondary tabular-nums"
              aria-hidden
            >
              {[...years.map(String), "All"].map((t, i) => (
                <span key={t} className={i % 2 && i !== years.length ? "hidden sm:inline" : ""}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <output className="w-24 text-right font-semibold tabular-nums text-text-primary">
            {year === null ? "All years" : `Up to ${year}`}
          </output>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Chart */}
        <div className="relative flex-1 min-w-0">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-auto font-sans"
            role="group"
            aria-label="Logical qubits against circuit size for published quantum algorithm resource estimates, grouped into clouds by algorithm area. Each point links to its paper; the table below lists the same data."
          >
            <defs>
              <clipPath id={clipId}>
                <rect x={M.left} y={M.top} width={PW} height={PH} />
              </clipPath>
            </defs>

            {/* out-of-scope shading */}
            <g fill="#f4f4f4">
              <rect
                x={M.left}
                y={M.top}
                width={sx(Math.log10(region.minGates)) - M.left}
                height={PH}
              />
              <rect
                x={sx(Math.log10(region.minGates))}
                y={sy(Math.log10(region.minQubits))}
                width={M.left + PW - sx(Math.log10(region.minGates))}
                height={M.top + PH - sy(Math.log10(region.minQubits))}
              />
            </g>

            {/* grid + ticks */}
            <g stroke="#e0e0e0" strokeWidth={1}>
              {Array.from({ length: X1 - X0 + 1 }, (_, i) => X0 + i).map((e) => (
                <line key={`gx${e}`} x1={sx(e)} x2={sx(e)} y1={M.top} y2={M.top + PH} />
              ))}
              {Array.from(
                { length: Math.floor(Y1) - Math.ceil(Y0) + 1 },
                (_, i) => Math.ceil(Y0) + i,
              ).map((e) => (
                <line key={`gy${e}`} x1={M.left} x2={M.left + PW} y1={sy(e)} y2={sy(e)} />
              ))}
            </g>
            <g fontSize={14} fill="#525252">
              {Array.from({ length: X1 - X0 + 1 }, (_, i) => X0 + i).map((e) => (
                <text key={`tx${e}`} x={sx(e)} y={M.top + PH + 24} textAnchor="middle">
                  <Superscript exp={e} />
                </text>
              ))}
              {Array.from(
                { length: Math.floor(Y1) - Math.ceil(Y0) + 1 },
                (_, i) => Math.ceil(Y0) + i,
              ).map((e) => (
                <text key={`ty${e}`} x={M.left - 10} y={sy(e) + 5} textAnchor="end">
                  <Superscript exp={e} />
                </text>
              ))}
            </g>
            <text x={M.left + PW / 2} y={H - 8} textAnchor="middle" fontSize={16} fill="#161616">
              Circuit size (gates)
            </text>
            <text
              transform={`translate(18 ${M.top + PH / 2}) rotate(-90)`}
              textAnchor="middle"
              fontSize={16}
              fill="#161616"
            >
              Width (logical qubits)
            </text>

            <g clipPath={`url(#${clipId})`}>
              {/* clouds */}
              {cloudSet.map((c) => {
                const a = byArea.get(c.area);
                if (!a || hidden.has(c.area)) return null;
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
              {shown.map((p, i) => {
                const a = byArea.get(p.area)!;
                const x = sx(Math.log10(p.gates));
                const y = sy(Math.log10(p.qubits));
                const isNew = year !== null && p.year === year;
                const key = `${p.reference}-${p.problem}-${i}`;
                const label = `${p.problem}: ${p.qubitsText} qubits, ${sci(p.gates)} ${p.gateType} gates, ${p.reference} (${p.year})`;
                const show = () => setHover({ p, x, y, key });
                const hide = () => setHover((h) => (h?.key === key ? null : h));
                const body = (
                  <>
                    {/* larger invisible hit target */}
                    <circle cx={x} cy={y} r={11} fill="transparent" />
                    {isNew && (
                      <circle cx={x} cy={y} r={11} fill="none" stroke="#161616" strokeWidth={2} />
                    )}
                    <Marker shape={a.shape} x={x} y={y} r={6} fill={a.color} stroke="#ffffff" />
                  </>
                );
                const handlers = {
                  onMouseEnter: show,
                  onMouseLeave: hide,
                  onFocus: show,
                  onBlur: hide,
                  "aria-label": label,
                  "aria-describedby": tip?.key === key ? tipId : undefined,
                  className: "outline-none focus-visible:[&>*]:stroke-[#0f62fe]",
                };
                // A real link: Enter opens it, middle-click works, screen
                // readers announce it. Points without a paper are just focusable.
                return p.url ? (
                  <a key={key} href={p.url} target="_blank" rel="noopener noreferrer" {...handlers}>
                    {body}
                  </a>
                ) : (
                  <g key={key} tabIndex={0} role="img" {...handlers}>
                    {body}
                  </g>
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

            {year !== null && (
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

          {tip && (
            <div
              id={tipId}
              role="tooltip"
              className="pointer-events-none absolute z-10 max-w-[320px] rounded-sm border border-border-subtle bg-white px-3 py-2 text-[13px] leading-[18px] text-text-primary shadow-lg"
              style={{
                left: `${(tip.x / W) * 100}%`,
                top: `${(tip.y / H) * 100}%`,
                transform: `translate(${tip.x / W > 0.6 ? "calc(-100% - 14px)" : "14px"}, -50%)`,
              }}
            >
              <p className="font-semibold">{tip.p.problem}</p>
              <p className="text-text-secondary">
                {byArea.get(tip.p.area)?.label}
                {tip.p.topic && tip.p.topic !== tip.p.area ? ` · ${tip.p.topic}` : ""}
              </p>
              <p className="mt-1 tabular-nums">
                {tip.p.qubitsText} qubits · {sci(tip.p.gates)} {tip.p.gateType}
              </p>
              <p className="text-text-secondary">
                {tip.p.reference} ({tip.p.year})
              </p>
              {tip.p.comments && (
                <p className="mt-1 italic text-text-secondary">{tip.p.comments}</p>
              )}
            </div>
          )}
        </div>

        {/* Legend (doubles as area toggles) */}
        <ul
          className="flex flex-row flex-wrap lg:flex-col gap-2 lg:w-[230px] shrink-0"
          aria-label="Algorithm areas"
        >
          {areas.map((a) => {
            const off = hidden.has(a.match);
            return (
              <li key={a.match}>
                <button
                  type="button"
                  onClick={() => toggle(a.match)}
                  aria-pressed={!off}
                  className={`flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-layer-01 ${off ? "text-text-secondary/60" : "text-text-primary"}`}
                >
                  <svg
                    width={16}
                    height={16}
                    viewBox="-8 -8 16 16"
                    aria-hidden
                    className="shrink-0"
                  >
                    <Marker
                      shape={a.shape}
                      x={0}
                      y={0}
                      r={5}
                      fill={off ? "transparent" : a.color}
                      stroke={a.color}
                    />
                  </svg>
                  <span className={off ? "line-through" : ""}>{a.label}</span>
                  <span className="ml-auto tabular-nums text-text-secondary">{a.count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
