# ClaimGuard Frontend

Next.js 16 (App Router) + wagmi/RainbowKit + genlayer-js frontend for the ClaimGuard
contract, targeting **GenLayer Studionet**.

## Stack

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS v4 (custom emerald/teal design tokens, light + dark theme)
- wagmi + RainbowKit for wallet connection (MetaMask / injected / WalletConnect / Rainbow —
  deliberately *not* Coinbase Smart Wallet, see the note in `next.config.ts` / `providers.tsx`)
- genlayer-js for all contract reads and writes
- @tanstack/react-query for read caching, alongside a small module-level cache + concurrency
  limiter + retry-with-backoff in `lib/genlayer/client.ts` (Studionet's RPC is shared and
  rate-limited)
- sonner for toasts

## Setup

```bash
npm install
cp .env.example .env.local
# .env.example already points NEXT_PUBLIC_CONTRACT_ADDRESS at the live
# deployment (0x67Ca1fE518e1Fa416DE2c2936094c7349b579dba) -- override it
# if you deploy your own copy via ../deploy/deployStudionet.mjs
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Connect a wallet (any injected/MetaMask
wallet works, no extra setup needed) — the app automatically prompts a network switch/add
for GenLayer Studionet (chain id `61999`) the first time you connect.

## Build

```bash
npm run build
npm start
```

Both `dev` and `build` explicitly pass `--webpack` (see `package.json`). RainbowKit's bundled
wallet list pulls in `@coinbase/cdp-sdk`'s experimental x402 payment code through the
Coinbase Smart Wallet connector, which Turbopack (Next 16's default bundler) currently can't
resolve — it lazy-`import()`s a few optional `@x402/*` packages that are never installed
because this app never uses that feature and doesn't offer Coinbase Wallet as an option in
the first place. Webpack's `externals` handles this cleanly (see the comment in
`next.config.ts`); Turbopack support may improve as the ecosystem catches up.

## Pages

| Route | Purpose |
|---|---|
| `/` | Landing page: hero, live protocol stats, how-it-works summary, recent pools |
| `/pools` | Browse all coverage pools (search + active-only filter) |
| `/pools/new` | Create a pool (coverage terms, premium, limits) |
| `/pools/[id]` | Pool detail — terms, stats, join/renew/cancel, top-up, file a claim (if covered), creator pause/resume, claims filed against this pool |
| `/claims/[id]` | Claim detail — description, evidence links, AI verdict, one-time appeal (if denied & you're the claimant) |
| `/dashboard` | Your coverage across all pools, your claims, pools you've created |
| `/how-it-works` | Full mechanics: claim lifecycle, AI consensus pattern, security model, FAQ |
| `/about` | Project mission, tech stack, links to source and the creator |

Social/repo links live in `lib/links.ts` (GitHub, Twitter/X, the live contract's explorer
URL) and are reused across the Navbar, Footer, and About page — update them in one place.

## Key implementation notes

**Amounts are strings, not numbers.** The contract deliberately stores wei-scale amounts
(`premium`, `balance`, `requested_amount`, etc.) as JSON *strings*, not JSON numbers — a
typical GEN amount in wei exceeds `Number.MAX_SAFE_INTEGER` (2^53), and a plain
`JSON.parse` would silently truncate it. `lib/types.ts` types these fields as `string`;
always route them through `formatGEN()` (display) or `BigInt(...)` (math) — never
`Number(...)`. `lib/utils.ts`'s `sumWei()` helper aggregates a list of them without ever
touching a JS `number`.

**Photos never get "uploaded" separately.** `lib/bytes.ts`'s `fileToBytes()` reads the
chosen image straight into a `Uint8Array`, which travels as part of the same
`file_claim` / `appeal_claim` transaction — there's no separate storage step, matching the
contract, which only ever uses the photo transiently for AI evaluation.

**Write flow.** `hooks/useClaimGuardContract.ts`'s `useContractWrite()` factory: submits via
a genlayer-js client wired to the connected wallet, then polls `getTransaction()` until a
[decided consensus state](https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/transactions/transaction-statuses)
is reached, then invalidates the relevant React Query caches. `components/ConsensusTxStatus.tsx`
renders that lifecycle (submitting → proposing → committing → revealing → accepted) as a
small animated stepper.

**"Decided" doesn't mean "succeeded."** A transaction reaching a decided consensus status
(ACCEPTED / FINALIZED / UNDETERMINED) only means validators agreed on an *outcome* — that
outcome can be "this call reverted" (wrong wei amount, expired policy, claim limit reached,
etc.), and it reaches consensus just as cleanly, since every validator independently hits
the same `gl.vm.UserError`. `getLeaderFailureMessage()` in `useClaimGuardContract.ts` checks
the decided transaction's `leader_receipt` (`error` / `execution_result`) before treating it
as a success, matching the GenLayerJS docs' "Checking execution results" guidance. Never
gate success purely on `isDecidedState(...)`.

**New record ids are read back, not decoded from the receipt.** `create_pool` and
`file_claim` both return an id, but parsing that value back out of a write receipt depends
on internal, network-specific decode behavior that isn't part of the documented API surface.
Instead, once a transaction finalizes, `pools/new/page.tsx` and `FileClaimForm.tsx` each make
one extra `readContract("get_pool_count")` / `readContract("get_claim_count")` call and use
`count - 1` — the id is stable because pool/claim ids are assigned sequentially and the count
has just been incremented by this exact transaction.
