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
      <article className="relative p-8 flex flex-col gap-4 w-full min-h-[200px] border border-layer-03">
        <p className="font-sans font-semibold text-[20px] leading-[28px] text-text-primary">
          {group.title}
        </p>
        <div>
          <span className="inline-block text-sm font-normal px-5 py-2 rounded-full border border-teal-70 text-text-primary">
            Coming Soon
          </span>
        </div>
      </article>
    );
  }

  return (
    <article className="relative p-8 flex flex-col justify-between gap-10 w-full min-h-[200px] hover:bg-layer-02 transition-colors border border-layer-03 focus-within:outline-2 focus-within:outline-teal-70 focus-within:outline-offset-0 focus-within:z-10">
      <div className="flex flex-col gap-4">
        <p className="font-sans font-semibold text-[20px] leading-[28px] text-text-primary">
          <Link
            href={`/working-groups/${group.id}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {group.title}
          </Link>
        </p>
        <div
          className="text-base text-text-secondary font-normal leading-[22px]"
          dangerouslySetInnerHTML={{ __html: group.shortDescription }}
        />
      </div>
      <ArrowRight size={16} className="text-text-primary shrink-0" />
    </article>
  );
}
