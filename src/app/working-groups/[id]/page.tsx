import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getWorkingGroups } from "@/lib/working-groups";
import {DetailsHeroBackground} from "@/app/working-groups/[id]/DetailsHeroBackground";


interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const group = getWorkingGroups().find((g) => g.id === id);
  if (!group) return {};
  const description = group.shortDescription.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return {
    title: `${group.title} | Quantum Technical Working Groups`,
    description,
  };
}

export default async function WorkingGroupPage({ params }: Props) {
  const { id } = await params;
  const groups = getWorkingGroups();
  const group = groups.find((g) => g.id === id);

  if (!group) notFound();

  return (
    <>
      {/* Hero banner */}
        <section className="bg-teal-70 relative py-[100px]">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <DetailsHeroBackground className="w-full h-full" />
          </div>
          <div className="px-10 py-16 max-w-page mx-auto flex flex-col items-center gap-4">
            <p className="text-sm text-white/70 tracking-[0.16px]">
              <Link href="/" className="hover:text-white transition-colors">
                Quantum Technical Working Groups
              </Link>
              {" /"}
            </p>
            <h1 className="font-serif font-normal text-[48px] leading-[56px] text-white text-center">
              {group.title}
            </h1>
          </div>
        </section>

        {/* Body */}
        <section className="bg-white">
          <div className="px-10 py-20 max-w-page mx-auto">
            <div className="max-w-page flex flex-col gap-16">
              {/* About */}
              <div className="flex flex-col gap-6">
                <h2 className="font-sans font-semibold text-[20px] leading-[28px] text-text-primary">
                  About this working group
                </h2>
                <p className="text-base text-text-secondary leading-[22px]">
                  {group.longDescription}
                </p>
              </div>

              {/* Joint steering committee */}
              <div className="flex flex-col gap-8">
                <h2 className="font-sans font-semibold text-[20px] leading-[28px] text-text-primary">
                  Joint steering committee
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {group.committeeMembers.map((member, i) => (
                    <div
                      key={i}
                      className="bg-layer-01 p-4 flex flex-col gap-1"
                    >
                      <p className="font-sans font-semibold text-base text-text-primary leading-[24px]">
                        {member.name}
                      </p>
                      <p className="font-sans font-normal text-base text-text-secondary leading-[24px]">
                        {member.institution}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div className="flex flex-col gap-8">
                <h2 className="font-sans font-semibold text-[20px] leading-[28px] text-text-primary">
                  Explore resources
                </h2>
                <div className="flex flex-col">
                  {group.resources.map((resource, i) => (
                    <div key={i}>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 py-3 text-base text-text-primary hover:underline leading-[22px]"
                      >
                        {resource.title}
                        <ArrowRight size={16} className="shrink-0" />
                      </a>
                      <hr className="border-border-subtle" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
    </>
  );
}

export async function generateStaticParams() {
  const groups = getWorkingGroups();
  return groups.map((g) => ({ id: g.id }));
}
