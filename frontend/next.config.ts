import type { NextConfig } from "next";

// @rainbow-me/rainbowkit's package entry statically pulls in every wallet
// connector it ships, including @wagmi/connectors' Coinbase Smart Wallet
// connector -- which in turn pulls in @coinbase/cdp-sdk's experimental
// x402 payment-protocol support. That code lazy-`import()`s a handful of
// optional `@x402/*` packages this app never installs and never needs (we
// don't use Coinbase's x402 payments feature, or even offer Coinbase
// Wallet as a connect option). The bundler tries to statically resolve
// those dynamic imports at build time and fails. Marking them external is
// the standard fix: that code path is never actually executed at runtime.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {},
  webpack: (config) => {
    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : []),
      "@x402/core",
      "@x402/core/client",
      "@x402/evm",
      "@x402/evm/exact/client",
      "@x402/evm/upto/client",
      "@x402/svm",
      "@x402/svm/exact/client",
    ];
    return config;
  },
};

export default nextConfig;
