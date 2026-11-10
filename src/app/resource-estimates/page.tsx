import type { Metadata } from "next";
import Link from "next/link";
import "katex/dist/katex.min.css";
import { DetailsHeroBackground } from "@/app/working-groups/[id]/DetailsHeroBackground";
import { getChartData } from "@/lib/resource-estimates/data";
import { AlgorithmSpace } from "./AlgorithmSpace";

export const metadata: Metadata = {
  title: "Charting quantum resource estimates | Quantum Technical Working Groups",
  description:
    "Published estimates of the logical qubits and operations needed to run quantum algorithms, grouped by application area.",
};

export default function ResourceEstimatesPage() {
  const data = getChartData();

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
            Charting quantum resource estimates
          </h1>
        </div>
      </section>

      <section className="bg-white">
        <div className="px-10 py-20 max-w-page mx-auto flex flex-col gap-16">
          <div className="flex flex-col gap-6 lg:max-w-[60%]">
            <h2 className="font-sans font-semibold text-[20px] leading-[28px] text-text-primary">
              Watch quantum algorithm exploration evolve
            </h2>
            <p className="text-base leading-[24px] text-text-secondary">
              Researchers are constantly looking to solve larger and more complex problems with
              quantum. New algorithm research sharpens the picture of the quantum resources required
              to tackle these computational challenges. Compare resource estimates below to learn
              how requirements have evolved over time.
            </p>
          </div>

          <AlgorithmSpace data={data} />

          {data.skipped.length > 0 && (
            <details className="text-sm text-text-secondary">
              <summary className="cursor-pointer">
                {data.skipped.length} more estimate{data.skipped.length === 1 ? "" : "s"} not shown
                on the chart
              </summary>
              <ul className="mt-2 list-disc pl-5 flex flex-col gap-1">
                {data.skipped.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </section>
    </>
  );
}
