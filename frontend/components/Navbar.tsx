"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useTheme } from "@/lib/theme-context";
import {
  ShieldCheck,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  PlusCircle,
  Github,
} from "lucide-react";
import { truncateAddress } from "@/lib/utils";
import { PROJECT_LINKS, CONTRACT_ADDRESS } from "@/lib/links";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/pools", label: "Pools" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-[62px] flex items-center px-5 md:px-8"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        borderBottom: "1px solid var(--nav-border)",
      }}
    >
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2.5 mr-6 flex-shrink-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #14b881 0%, #0d5f45 100%)",
            boxShadow: "0 0 14px rgba(20,184,129,0.4)",
          }}
        >
          <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span
          className="font-display text-lg font-bold hidden sm:inline"
          style={{ color: "var(--text-primary)", letterSpacing: "0.04em" }}
        >
          CLAIMGUARD
        </span>
      </Link>

      {/* Center nav links */}
      <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
        {navLinks.map(({ href, label }) => {
          const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="relative px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors duration-150 whitespace-nowrap"
              style={{ color: active ? "#4fd8a8" : "var(--text-muted)" }}
            >
              {active && (
                <span
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: isLight ? "rgba(15,122,87,0.08)" : "rgba(20,184,129,0.12)",
                    border: "1px solid rgba(20,184,129,0.22)",
                  }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex-1 lg:hidden" />

      {/* Contract address pill */}
      <a
        href={PROJECT_LINKS.explorerContract}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono mr-2 transition-colors hover:brightness-110"
        style={{
          background: "rgba(20,184,129,0.08)",
          border: "1px solid rgba(20,184,129,0.22)",
          color: "#4fd8a8",
        }}
        title="View contract on Studionet Explorer"
      >
        <span style={{ color: "var(--text-muted)", fontSize: 10 }}>CA</span>
        {CONTRACT_ADDRESS.slice(0, 6)}…{CONTRACT_ADDRESS.slice(-4)}
      </a>

      {/* GitHub */}
      <a
        href={PROJECT_LINKS.github}
        target="_blank"
        rel="noopener noreferrer"
        title="View source on GitHub"
        className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center transition-all duration-200 mr-1"
        style={{
          background: isLight ? "rgba(15,122,87,0.06)" : "rgba(255,255,255,0.05)",
          border: isLight ? "1px solid rgba(15,122,87,0.12)" : "1px solid rgba(255,255,255,0.08)",
          color: "var(--text-secondary)",
        }}
      >
        <Github className="w-3.5 h-3.5" />
      </a>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto lg:ml-0">
        <Link
          href="/pools/new"
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-150"
          style={{
            background: isLight ? "rgba(15,122,87,0.07)" : "rgba(20,184,129,0.10)",
            border: "1px solid rgba(20,184,129,0.2)",
            color: "#0f7a57",
          }}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          New Pool
        </Link>

        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{
            background: isLight ? "rgba(15,122,87,0.06)" : "rgba(255,255,255,0.05)",
            border: isLight ? "1px solid rgba(15,122,87,0.12)" : "1px solid rgba(255,255,255,0.08)",
            color: "var(--text-secondary)",
          }}
        >
          {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>

        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div {...(!ready && { "aria-hidden": true, style: { opacity: 0, pointerEvents: "none" } })}>
                {!connected ? (
                  <button onClick={openConnectModal} className="btn-primary px-4 py-1.5 rounded-lg text-white text-[13px] font-bold">
                    Connect Wallet
                  </button>
                ) : chain.unsupported ? (
                  <button
                    onClick={openChainModal}
                    className="rounded-lg border border-red-500/25 bg-red-500/12 px-3.5 py-1.5 text-[13px] font-bold text-red-400"
                  >
                    Wrong Network
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={openAccountModal}
                      className="flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 text-[13px] font-semibold font-mono"
                      style={{
                        background: isLight ? "rgba(15,122,87,0.07)" : "rgba(20,184,129,0.12)",
                        borderColor: "rgba(20,184,129,0.24)",
                        color: isLight ? "#0d5f45" : "#8fe9c8",
                      }}
                    >
                      {account.ensName ?? truncateAddress(account.address)}
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </button>
                    <button
                      onClick={openAccountModal}
                      title="Wallet"
                      className="flex items-center justify-center rounded-[10px] border border-red-500/20 bg-red-500/10 p-1.5 text-red-400"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </nav>
  );
}
