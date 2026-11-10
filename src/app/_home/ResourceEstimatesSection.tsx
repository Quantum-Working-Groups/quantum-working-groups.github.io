import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ResourceEstimatesSection() {
  return (
    <div className="mt-0 grid items-center gap-10 border border-t-0 border-layer-03 p-8 lg:grid-cols-2 lg:p-16">
      <Image
        src="/resource-estimates-preview.png"
        alt="Chart of published quantum resource estimates by application area"
        width={990}
        height={590}
        className="h-auto w-full shadow-nav"
      />
      <div className="flex flex-col items-start gap-6">
        <h2 className="font-sans font-semibold text-[24px] leading-[32px] text-text-primary text-balance">
          Estimating quantum resource requirements
        </h2>
        <p className="text-base leading-[24px] text-text-secondary">
          As new quantum algorithms and applications are discovered, we develop a better sense of
          the quantum compute resources required to tackle them. Explore how published qubit and
          operation estimations have evolved over time and across research areas.
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
