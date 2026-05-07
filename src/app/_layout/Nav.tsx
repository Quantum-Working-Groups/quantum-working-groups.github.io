import Link from "next/link";
import { GithubIcon } from "@/components/icons/GithubIcon";

export function Nav() {
  return (
    <nav className="bg-white shadow-nav shrink-0">
      <div className="flex h-[80px] items-center justify-between px-8 max-w-page mx-auto">
        <Link
          href="/"
          className="font-sans font-semibold text-sm tracking-[0.16px] text-black hover:opacity-70 transition-opacity"
        >
          Quantum Technical Working Groups
        </Link>
        <a
          href="https://github.com/placeholder/placeholder"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-text-primary hover:bg-gray-100 rounded-full"
          aria-label="GitHub repository"
        >
          <GithubIcon size={20} />
        </a>
      </div>
    </nav>
  );
}
