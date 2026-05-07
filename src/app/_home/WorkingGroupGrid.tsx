import { WorkingGroupCard } from "./WorkingGroupCard";
import type { WorkingGroup } from "@/lib/schema";

interface WorkingGroupGridProps {
  groups: WorkingGroup[];
}

export function WorkingGroupGrid({ groups }: WorkingGroupGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
      {groups.map((group) => (
        <WorkingGroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}
