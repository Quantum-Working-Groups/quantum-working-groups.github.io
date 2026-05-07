import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { WorkingGroup } from "@/lib/schema";

interface WorkingGroupCardProps {
  group: WorkingGroup;
}

export function WorkingGroupCard({ group }: WorkingGroupCardProps) {
  return (
    <Link
      href={`/working-groups/${group.id}`}
      className="p-8 flex flex-col justify-between gap-10 w-full min-h-[200px] hover:bg-layer-02 relative transition-colors border border-layer-03"
    >
      <div className="flex flex-col gap-4">
        <p className="font-sans font-semibold text-[20px] leading-[28px] text-text-primary">
          {group.title}
        </p>
        <div
          className="text-base text-text-secondary font-normal leading-[22px]"
          dangerouslySetInnerHTML={{ __html: group.shortDescription }}
        />
      </div>
      <ArrowRight size={16} className="text-text-primary shrink-0" />
    </Link>
  );
}
