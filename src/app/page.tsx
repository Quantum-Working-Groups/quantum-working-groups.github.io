import { getWorkingGroups } from "@/lib/working-groups";
import { WorkingGroupGrid } from "./_home/WorkingGroupGrid";
import { HeroDotGrid } from "./_home/HeroDotGrid";
import { HeroDotGridStatic } from "./_home/HeroDotGridStatic";
import Link from "next/link";

export default function Home() {
  const groups = getWorkingGroups();

  return (
    <>
      {/* Hero */}
      <section>
        <div className="max-w-page mx-auto flex flex-col items-center lg:flex-row p-[40px] lg:p-[80px] gap-[40px] lg:gap-[80px]">

          <div className="flex pointer-events-none lg:order-last lg:justify-end">
            <HeroDotGrid height={419} className="hidden lg:block" />
            <HeroDotGridStatic height={292} className="lg:hidden" />
          </div>

          <div className="flex flex-col gap-8 text-center lg:text-left">
            <h1 className="font-serif font-normal text-[54px] leading-[64px] text-text-primary">
              Quantum research for the real world
            </h1>
            <p className="text-base text-text-secondary leading-[24px]">
              Select a working group below to explore its mission, steering
              committee, and key publications.
            </p>
            <div className="flex justify-center lg:justify-start">
              <Link
                href="/#working-groups"
                className="inline-flex items-center gap-2 bg-teal-70 text-white text-sm tracking-[0.16px] px-6 py-3 rounded-[50px] hover:bg-[#004d4d] transition-colors"
              >
                Learn more
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 3v10M3 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Card grid */}
      <section id="working-groups" className="bg-white">
        <div className="px-10 py-20 max-w-page mx-auto">
          <WorkingGroupGrid groups={groups} />
        </div>
      </section>
    </>
  );
}
