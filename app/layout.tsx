import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "The Meme Company",
  description: "Hold $MEME. Every 24 hours, fees buy a new coin and send it to the top 100 holders.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <Nav />
          <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
          <footer className="max-w-6xl mx-auto px-6 py-8 text-xs text-muted border-t border-white/10 mt-16">
            <div className="flex justify-between">
              <span>THE MEME COMPANY // INCORPORATED ON SOLANA</span>
              <span>EST. 2026</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
