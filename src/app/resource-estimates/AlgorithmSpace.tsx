"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { ChartData, Point } from "@/lib/resource-estimates/data";
import { ChartPlot, H, Marker, W, sci } from "./ChartPlot";
import { EstimatesTable } from "./EstimatesTable";

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
          <ChartPlot
            data={data}
            clouds={cloudSet}
            points={shown}
            hidden={hidden}
            year={year}
            clipId={clipId}
            label="Qubits against operations for published quantum algorithm resource estimates, grouped into clouds by algorithm area. Each point links to its paper; the table below lists the same data."
            renderPoint={({ p, index, x, y, area, isNew }) => {
              const key = `${p.reference}-${p.problem}-${index}`;
              const label = `${p.problemText}: ${p.qubitsText} qubits, ${sci(p.gates)} ${p.gateType} gates, ${p.reference} (${p.year})`;
              const show = () => setHover({ p, x, y, key });
              const hide = () => setHover((h) => (h?.key === key ? null : h));
              const body = (
                <>
                  {/* larger invisible hit target */}
                  <circle cx={x} cy={y} r={11} fill="transparent" />
                  {isNew && (
                    <circle cx={x} cy={y} r={11} fill="none" stroke="#161616" strokeWidth={2} />
                  )}
                  <Marker shape={area.shape} x={x} y={y} r={6} fill={area.color} stroke="#ffffff" />
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
            }}
          />

          {tip && (
            <div
              id={tipId}
              role="tooltip"
              className="pointer-events-none absolute z-10 w-max min-w-[220px] max-w-[320px] border-l-4 bg-white px-4 py-3 text-[13px] leading-[20px] text-text-primary shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
              style={{
                borderLeftColor: byArea.get(tip.p.area)?.color,
                left: `${(tip.x / W) * 100}%`,
                top: `${(tip.y / H) * 100}%`,
                transform: `translate(${tip.x / W > 0.6 ? "calc(-100% - 14px)" : "14px"}, -50%)`,
              }}
            >
              <p
                className="mb-3 text-sm font-semibold"
                dangerouslySetInnerHTML={{ __html: tip.p.problemHtml }}
              />
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-0.5 tabular-nums">
                <dt>Qubits</dt>
                <dd className="text-right">{tip.p.qubitsText}</dd>
                <dt>Operations</dt>
                <dd className="text-right">
                  {tip.p.gates.toExponential(1)}
                  {tip.p.converted && "*"}
                  {tip.p.gateType !== "T" && ` ${tip.p.gateType}`}
                </dd>
                <dt>Year</dt>
                <dd className="text-right">{tip.p.year}</dd>
                <dt>Reference</dt>
                <dd className="text-right">{tip.p.reference}</dd>
              </dl>
              {tip.p.converted && (
                <p className="mt-2 text-text-secondary">
                  * Converted from {tip.p.reportedGates.toExponential(1)} Toffoli
                </p>
              )}
              {tip.p.commentsHtml && (
                <p
                  className="mt-2 italic text-text-secondary"
                  dangerouslySetInnerHTML={{ __html: tip.p.commentsHtml }}
                />
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

      <EstimatesTable points={shown} areas={areas} />
    </div>
  );
}
