import type { Metadata } from "next";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Providers, WrongNetworkBanner } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "ClaimGuard — AI-Adjudicated Mutual Coverage on GenLayer",
  description:
    "Peer-funded coverage pools where GenLayer's AI-validator consensus reviews photo and web evidence to adjudicate claims — no adjuster, no admin withdrawal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-grid antialiased">
        <Providers>
          <Navbar />
          <WrongNetworkBanner />
          <main className="pt-[62px]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
