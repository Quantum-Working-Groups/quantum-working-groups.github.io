import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ChartPlot } from "@/app/resource-estimates/ChartPlot";
import { getChartData } from "@/lib/resource-estimates/data";

export function ResourceEstimatesSection() {
  const data = getChartData();

  return (
    <div className="mt-0 grid items-center gap-10 border border-t-0 border-layer-03 p-8 lg:grid-cols-2 lg:p-16">
      <div className="bg-white p-2 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <ChartPlot
          data={data}
          clouds={data.clouds.all}
          points={data.points}
          clipId="home-chart-plot"
          label="Chart of published quantum resource estimates: qubits against operations, grouped by application area."
          readOnly
        />
      </div>
      <div className="flex flex-col items-start gap-6">
        <h2 className="font-sans font-semibold text-[24px] leading-[32px] text-text-primary text-balance">
          Charting quantum resource estimates
        </h2>
        <p className="text-base leading-[24px] text-text-secondary">
          Researchers are uncovering algorithms where quantum will provide a significant speedup.
          But how big a quantum computer will you need to run them? See how algorithm development is
          charting the landscape of quantum&apos;s capabilities.
        </p>
        <Link
          href="/resource-estimates"
          className="inline-flex items-center gap-2 rounded-full border border-teal-70 px-6 py-3 text-sm tracking-[0.16px] text-teal-70 hover:bg-layer-01 transition-colors"
        >
          Explore
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
