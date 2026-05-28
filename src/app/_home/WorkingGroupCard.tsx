import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { WorkingGroup } from "@/lib/schema";

interface WorkingGroupCardProps {
  group: WorkingGroup;
}

export function WorkingGroupCard({ group }: WorkingGroupCardProps) {
  const isPending = group.status === "pending";

  if (isPending) {
    return (
      <article className="relative p-8 row-span-3 grid [grid-template-rows:subgrid] w-full border border-layer-03">
        <p className="font-sans font-semibold text-[20px] leading-[28px] text-text-primary">
          {group.title}
        </p>
        <div className="pt-4">
          <span className="inline-block text-sm font-normal px-5 py-2 rounded-full border border-teal-70 text-text-primary">
            Coming Soon
          </span>
        </div>
        <div />
      </article>
    );
  }

  return (
    <article className="relative p-8 row-span-3 grid [grid-template-rows:subgrid] w-full hover:bg-layer-02 transition-colors border border-layer-03 focus-within:outline-2 focus-within:outline-teal-70 focus-within:outline-offset-0 focus-within:z-10">
      <p className="font-sans font-semibold text-[20px] leading-[28px] text-text-primary">
        <Link
          href={`/working-groups/${group.id}`}
          className="after:absolute after:inset-0 focus-visible:outline-none"
        >
          {group.title}
        </Link>
      </p>
      <div
        className="text-base text-text-secondary font-normal leading-[22px] pt-4"
        dangerouslySetInnerHTML={{ __html: group.shortDescription }}
      />
      <div className="pt-6">
        <ArrowRight size={16} className="text-text-primary shrink-0" />
      </div>
    </article>
  );
}
