#!/usr/bin/env node
/**
 * Deploys contracts/claimguard.py to GenLayer Studionet.
 *
 * Studionet (https://studio.genlayer.com/api, chain id 61999) is GenLayer's
 * hosted zero-setup network -- no Docker, no local validators, just an
 * account and GEN. This script deploys ClaimGuard there directly via
 * genlayer-js, without going through the `genlayer deploy` CLI's
 * deploy-script runner, so it's a single self-contained file you can read
 * top to bottom.
 *
 * Usage:
 *   node deploy/deployStudionet.mjs                 # fresh throwaway account
 *   PRIVATE_KEY=0x... node deploy/deployStudionet.mjs # reuse an existing one
 *
 * If you don't pass PRIVATE_KEY, a brand-new account is generated on every
 * run and printed to the terminal -- convenient for a quick one-off deploy,
 * but you will need to fund a NEW address each time. For anything you want
 * to keep interacting with afterwards, generate a key once, save it
 * somewhere safe, and pass it back in via PRIVATE_KEY.
 *
 * Either way, before deploying you need GEN in that account. Studionet has
 * a built-in faucet: open https://studio.genlayer.com, select/import the
 * same account, and click the 💧 button in the account selector.
 */

import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const account = process.env.PRIVATE_KEY
    ? createAccount(process.env.PRIVATE_KEY)
    : createAccount();

  console.log("Deploying from account:", account.address);
  if (!process.env.PRIVATE_KEY) {
    console.log(
      "(No PRIVATE_KEY set -- this is a fresh, throwaway account. " +
        "Fund it via the Studio faucet before this will succeed, and " +
        "save its key if you want to reuse this deployment later.)"
    );
  }

  const client = createClient({
    chain: studionet,
    account,
  });

  const contractPath = path.resolve(__dirname, "..", "contracts", "claimguard.py");
  const code = new Uint8Array(readFileSync(contractPath));

  console.log("Submitting deployment transaction...");
  const txHash = await client.deployContract({ code, args: [] });
  console.log("Transaction hash:", txHash);

  console.log("Waiting for the transaction to be accepted...");
  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: "ACCEPTED",
    retries: 200,
    interval: 3000,
  });

  const contractAddress = receipt?.data?.contract_address;
  if (!contractAddress) {
    throw new Error(
      `Deployment did not return a contract address. Full receipt:\n${JSON.stringify(receipt, null, 2)}`
    );
  }

  console.log("\n✅ ClaimGuard deployed to Studionet");
  console.log("   Contract address:", contractAddress);
  console.log("   Explorer:", `https://explorer-studio.genlayer.com/address/${contractAddress}`);
  console.log(
    "\nNext: create a pool with create_pool(name, description, premium, " +
      "coverage_period_days, max_payout_per_claim, max_claims_per_period), " +
      "e.g. via the Studio UI's contract page for this address, or gltest / " +
      "genlayer-js from a small script."
  );
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
