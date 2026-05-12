import {
  RADIUS,
  STROKE_WIDTH,
  TRACKS,
  VIEWBOX_H,
  VIEWBOX_W,
  cellX,
  cellY,
} from "./hero-dot-grid-data";

type Props = {
  width?: number;
  height?: number;
  className?: string;
};

export function HeroDotGridStatic({ width, height, className }: Props) {
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
          id="heroDotGridStaticStroke"
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
        const [r0, c0] = cells[2];
        return (
          <circle
            key={id}
            cx={cellX(c0)}
            cy={cellY(r0)}
            r={RADIUS}
            stroke="url(#heroDotGridStaticStroke)"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
        );
      })}
    </svg>
  );
}
