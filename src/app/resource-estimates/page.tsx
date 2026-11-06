import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DetailsHeroBackground } from "@/app/working-groups/[id]/DetailsHeroBackground";
import { getChartData } from "@/lib/resource-estimates/data";
import { AlgorithmSpace } from "./AlgorithmSpace";

export const metadata: Metadata = {
  title: "Quantum algorithm resource estimates | Quantum Technical Working Groups",
  description:
    "Published estimates of the logical qubits and non-Clifford gates needed to run quantum algorithms, grouped by application area.",
};

export default function ResourceEstimatesPage() {
  // Runs at build time: loads and validates the YAML, computes every cloud.
  const data = getChartData();
  const rows = [...data.points].sort((a, b) => a.area.localeCompare(b.area) || a.gates - b.gates);
  const label = new Map(data.areas.map((a) => [a.match, a.label]));
  const color = new Map(data.areas.map((a) => [a.match, a.color]));

  return (
    <>
      <section className="bg-[#004144] relative py-[100px]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <DetailsHeroBackground className="w-full h-full" />
        </div>
        <div className="relative z-10 px-10 py-16 mx-auto flex flex-col items-center gap-4 max-w-[850px]">
          <p className="text-sm text-white/70 tracking-[0.16px]">
            <Link href="/" className="hover:text-white transition-colors">
              Quantum Technical Working Groups
            </Link>
            {" /"}
          </p>
          <h1 className="font-serif font-normal text-[48px] leading-[56px] text-white text-center text-balance">
            Quantum algorithm resource estimates
          </h1>
        </div>
      </section>

      <section className="bg-white">
        <div className="px-10 py-20 max-w-page mx-auto flex flex-col gap-16">
          <div className="flex flex-col gap-6 lg:max-w-[60%]">
            <h2 className="font-sans font-semibold text-[20px] leading-[28px] text-text-primary">
              Where the algorithms sit
            </h2>
            <p className="text-base leading-[24px] text-text-secondary">
              Each point is a published estimate of the logical qubits (width) and T or Toffoli
              gates (circuit size) an algorithm needs for a concrete problem. Clouds group estimates
              by application area. Hover a point for details, click it to open the paper, and step
              through publication years to see how the landscape has moved.
            </p>
          </div>

          <AlgorithmSpace data={data} />

          {/* Data table: the same numbers without the chart */}
          <div className="flex flex-col gap-6">
            <h2 className="font-sans font-semibold text-[20px] leading-[28px] text-text-primary">
              All {data.points.length} estimates
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-text-secondary border-b border-border-subtle">
                  <tr>
                    {["Area", "Problem", "Qubits", "Gates", "Year", "Reference"].map((h) => (
                      <th key={h} scope="col" className="py-2 pr-4 font-semibold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p, i) => (
                    <tr key={i} className="border-b border-border-subtle align-top">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        <span
                          className="inline-block size-2.5 rounded-[2px] mr-2 align-middle"
                          style={{ background: color.get(p.area) }}
                          aria-hidden
                        />
                        {label.get(p.area) ?? p.area}
                      </td>
                      <td className="py-2 pr-4">{p.problem}</td>
                      <td className="py-2 pr-4 tabular-nums whitespace-nowrap">{p.qubitsText}</td>
                      <td className="py-2 pr-4 tabular-nums whitespace-nowrap">
                        {p.gates.toExponential(1)} {p.gateType}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">{p.year}</td>
                      <td className="py-2 pr-4">
                        {p.url ? (
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {p.reference}
                          </a>
                        ) : (
                          p.reference
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.skipped.length > 0 && (
              <details className="text-sm text-text-secondary">
                <summary className="cursor-pointer">
                  {data.skipped.length} more estimate{data.skipped.length === 1 ? "" : "s"} not
                  shown on the chart
                </summary>
                <ul className="mt-2 list-disc pl-5 flex flex-col gap-1">
                  {data.skipped.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          <a
            href="https://github.com/Quantum-Working-Groups/quantum-working-groups.github.io/tree/main/data/resource-estimates"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-base text-text-primary hover:underline"
          >
            Add or correct an estimate on GitHub
            <ArrowRight size={16} className="shrink-0" />
          </a>
        </div>
      </section>
    </>
  );
}
