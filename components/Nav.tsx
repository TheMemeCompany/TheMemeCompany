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
          <Image src="/logo.png" alt="The Meme Company" width={40} height={40} className="rounded-full" />
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-widest">THE MEME COMPANY</div>
            <div className="text-[10px] text-muted uppercase tracking-widest">Incorporated on Solana</div>
          </div>
        </Link>
        <div className="flex items-center gap-6 text-xs uppercase tracking-widest">
          {link("/", "HQ")}
          {link("/employees", "Employees")}
          {link("/meetings", "Shareholder Meetings")}
          {link("/forum", "Leaderboard")}
          {link("/claim", "Distributions")}
          <Link href="/admin" className="text-muted hover:text-accent transition-colors">Admin</Link>
        </div>
      </div>
    </nav>
  );
}
