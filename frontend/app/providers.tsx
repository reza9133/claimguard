"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useAccount, useSwitchChain, useChainId } from "wagmi";
import { createConfig, http } from "wagmi";
import {
  RainbowKitProvider,
  connectorsForWallets,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { Toaster } from "sonner";
import { ReactNode, useState, useEffect } from "react";
import { ThemeProvider, useTheme } from "@/lib/theme-context";

/* ── GenLayer Studionet ─────────────────────────────────────────────────── */
// Chain ID 61999 · RPC https://studio.genlayer.com/api
export const STUDIONET_CHAIN_ID = 61999;

const studionetChain = {
  id: STUDIONET_CHAIN_ID,
  name: "GenLayer Studionet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://studio.genlayer.com/api"] },
    public: { http: ["https://studio.genlayer.com/api"] },
  },
  blockExplorers: {
    default: {
      name: "GenLayer Explorer",
      url: "https://explorer-studio.genlayer.com",
    },
  },
  testnet: true,
} as const;

/* ── RainbowKit + wagmi config — Studionet only ─────────────────────────── */
// Built explicitly (rather than RainbowKit's getDefaultConfig) so we can
// leave out the Coinbase Smart Wallet connector: it pulls in
// @coinbase/cdp-sdk's experimental x402 payment code, which references a
// handful of optional packages this app never installs and doesn't need.
// A browser wallet (MetaMask/injected), WalletConnect, and Rainbow Wallet
// cover everything ClaimGuard actually requires.
const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [injectedWallet, metaMaskWallet, walletConnectWallet, rainbowWallet],
    },
  ],
  {
    appName: "ClaimGuard — Mutual Coverage on GenLayer",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "claimguard_dev_placeholder",
  }
);

const wagmiConfig = createConfig({
  connectors,
  chains: [studionetChain],
  transports: {
    [studionetChain.id]: http(),
  },
  ssr: true,
});

/* ── Auto-switch: silently switches wallet to Studionet on connect ──────── */
function NetworkEnforcer() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (isConnected && chainId !== STUDIONET_CHAIN_ID) {
      switchChain({ chainId: STUDIONET_CHAIN_ID });
    }
  }, [isConnected, chainId, switchChain]);

  return null;
}

/* ── Wrong-network banner ───────────────────────────────────────────────── */
export function WrongNetworkBanner() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || chainId === STUDIONET_CHAIN_ID) return null;

  return (
    <div className="fixed top-[62px] left-0 right-0 z-40 flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-700 to-red-500">
      <span>⚠ Wrong network — ClaimGuard requires GenLayer Studionet</span>
      <button
        onClick={() => switchChain({ chainId: STUDIONET_CHAIN_ID })}
        disabled={isPending}
        className="rounded-lg border border-white/40 bg-white/20 px-3.5 py-1 text-xs font-bold disabled:opacity-60"
      >
        {isPending ? "Switching…" : "Switch Network"}
      </button>
    </div>
  );
}

/* ── RainbowKit wrapper ─────────────────────────────────────────────────── */
function RainbowWrapper({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  const rkTheme =
    theme === "light"
      ? lightTheme({
          accentColor: "#0f7a57",
          accentColorForeground: "white",
          borderRadius: "large",
          fontStack: "system",
        })
      : darkTheme({
          accentColor: "#14b881",
          accentColorForeground: "white",
          borderRadius: "large",
          fontStack: "system",
          overlayBlur: "small",
        });

  return (
    <RainbowKitProvider theme={rkTheme} initialChain={STUDIONET_CHAIN_ID}>
      <NetworkEnforcer />
      {children}
    </RainbowKitProvider>
  );
}

/* ── Root Providers ─────────────────────────────────────────────────────── */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20_000,
            retry: 2,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowWrapper>
            {children}
            <ToasterWithTheme />
          </RainbowWrapper>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}

function ToasterWithTheme() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style:
          theme === "light"
            ? {
                background: "#ffffff",
                border: "1px solid rgba(15,122,87,0.18)",
                color: "#04150f",
                boxShadow: "0 8px 32px rgba(15,122,87,0.12)",
              }
            : {
                background: "#0a1a15",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#f0fff8",
              },
      }}
    />
  );
}
