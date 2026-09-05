import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Navbar, MobileNav, Footer } from "@/components/layout/navbar";
import { AudioProvider } from "@/components/providers/audio-provider";
import { MiniPlayer } from "@/components/music/mini-player";
import { BRAND } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: BRAND.name,
    description: BRAND.description,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#09090B] text-[#FAFAFA] antialiased">
        <AudioProvider>
          <div className="flex min-h-screen flex-col pb-24 md:pb-16">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <MiniPlayer />
          <MobileNav />
          <Toaster
            theme="dark"
            position="top-center"
            toastOptions={{
              style: {
                background: "#18181B",
                border: "1px solid #27272A",
                color: "#FAFAFA",
              },
            }}
          />
        </AudioProvider>
      </body>
    </html>
  );
}
