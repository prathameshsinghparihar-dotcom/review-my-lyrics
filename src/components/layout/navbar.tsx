"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, Home, Search, Upload } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");

  const linkClass = (href: string) =>
    cn(
      "text-sm font-medium transition hover:text-zinc-50",
      pathname === href || pathname.startsWith(href + "/")
        ? "text-zinc-50"
        : "text-zinc-400"
    );

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight text-zinc-50">
          {BRAND.nameUpper}
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/discover" className={linkClass("/discover")}>
            Discover
          </Link>
          <Link href="/discover" className={linkClass("/songs")}>
            Songs
          </Link>
          <Link href="/publish" className={linkClass("/publish")}>
            Publish
          </Link>
        </nav>

        <form
          className="ml-auto hidden max-w-md flex-1 md:block"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
          }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search songs, artists, lyrics..."
              className="pl-9"
              aria-label="Search songs, artists, lyrics"
            />
          </div>
        </form>

        <Link
          href="/search"
          className="ml-auto rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 md:hidden"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/discover", label: "Discover", icon: Compass },
    { href: "/publish", label: "Publish", icon: Upload },
    { href: "/search", label: "Search", icon: Search },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 py-2.5 text-[10px]",
                  active ? "text-purple-400" : "text-zinc-500"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800/80 bg-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between md:px-6">
        <p className="font-semibold text-zinc-300">{BRAND.nameUpper}</p>
        <p>Listen. Read. React to every line.</p>
        <p>Add songs in <code className="text-zinc-400">public/library/songs</code></p>
      </div>
    </footer>
  );
}
