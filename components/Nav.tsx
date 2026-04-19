"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function Nav() {
  const path = usePathname();
  const link = (href: string, label: string) => (
    <Link href={href} className={`hover:text-accent transition-colors ${path === href ? "text-accent" : ""}`}>
      {label}
    </Link>
  );

  return (
    <nav className="border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="One Coin to Save Them All" width={40} height={40} className="rounded-full" />
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-widest">ONE COIN TO SAVE THEM ALL</div>
            <div className="text-[10px] text-muted uppercase tracking-widest">Built on Solana</div>
          </div>
        </Link>
        <div className="flex items-center gap-6 text-xs uppercase tracking-widest">
          {link("/", "HQ")}
          {link("/kols", "KOLs")}
          {link("/meetings", "Community Vote")}
          {link("/forum", "Leaderboard")}
          {link("/claim", "Distributions")}
          <Link href="/admin" className="text-muted hover:text-accent transition-colors">Admin</Link>
          <a href="https://x.com/SaveThemAllpump" target="_blank" className="hover:text-accent transition-colors" aria-label="X / Twitter">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </div>
    </nav>
  );
}
