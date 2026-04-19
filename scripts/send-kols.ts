/**
 * THE MEME COMPANY - KOL Airdrop Script
 *
 * Usage:
 *   npx tsx scripts/send-kols.ts <AMOUNT_PER_WALLET> [DECIMALS]
 *
 * Example:
 *   npx tsx scripts/send-kols.ts 100000 6
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
} from "@solana/spl-token";
import bs58 from "bs58";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// ── KOL Wallets ───────────────────────────────────────────────────────────────

const KOL_WALLETS: string[] = [
  "CNudZYFgpbT26fidsiNrWfHeGTBMMeVWqruZXsEkcUPc",
  "4sAUSQFdvWRBxR8UoLBYbw8CcXuwXWxnN8pXa4mtm5nU",
  "BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu",
  "ATFRUwvyMh61w2Ab6AZxUyxsAfiiuG1RqL6iv3Vi9q2B",
  "8zFZHuSRuDpuAR7J6FzwyF3vKNx4CVW3DFHJerQhc7Zd",
  "BMgsHTvcasRVtuevHJh8t6Vf5dmcWkDLAx6gSAQ3dsYm",
  "J23qr98GjGJJqKq9CBEnyRhHbmkaVxtTJNNxKu597wsA",
  "DuQabFqdC9eeBULVa7TTdZYxe8vK8ct5DZr4Xcf7docy",
  "8yJFWmVTQq69p6VJxGwpzW7ii7c5J9GRAtHCNMMQPydj",
  "BXAWg4JbaeyvAHpiyYQ3Xr3bUh6FsyDHwwSkB5dmyGF",
];

// ── Config ────────────────────────────────────────────────────────────────────

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com";
const TOKEN_MINT = process.env.NEXT_PUBLIC_TOKEN_MINT!;
const PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY!;
const BATCH_SIZE = 5;

const [, , AMOUNT_ARG, DECIMALS_ARG] = process.argv;

if (!AMOUNT_ARG) {
  console.error("Usage: npx tsx scripts/send-kols.ts <AMOUNT_PER_WALLET> [DECIMALS]");
  process.exit(1);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!TOKEN_MINT) throw new Error("NEXT_PUBLIC_TOKEN_MINT not set in .env.local");
  if (!PRIVATE_KEY) throw new Error("TREASURY_PRIVATE_KEY not set in .env.local");

  const decimals = Number(DECIMALS_ARG ?? 6);
  const amountPerWallet = BigInt(Math.floor(Number(AMOUNT_ARG) * 10 ** decimals));
  const humanAmount = Number(AMOUNT_ARG);

  const conn = new Connection(RPC_URL, "confirmed");
  const treasury = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));

  console.log("THE MEME COMPANY - KOL Airdrop");
  console.log("Treasury: " + treasury.publicKey.toBase58());
  console.log("Token: " + TOKEN_MINT);
  console.log("Amount per wallet: " + humanAmount.toLocaleString() + " tokens");
  console.log("Wallets: " + KOL_WALLETS.length);
  console.log("Total: " + (humanAmount * KOL_WALLETS.length).toLocaleString() + " tokens\n");

  // Build allocations list
  const allocations = KOL_WALLETS.map((wallet) => ({ wallet, share: amountPerWallet }));

  let success = 0;
  let failed = 0;
  const results: { wallet: string; sig?: string; error?: string }[] = [];

  for (let i = 0; i < allocations.length; i += BATCH_SIZE) {
    const batch = allocations.slice(i, i + BATCH_SIZE);
    const tx = new Transaction();
    const ataInstructions: { wallet: string }[] = [];

    for (const alloc of batch) {
      try {
        const recipientPk = new PublicKey(alloc.wallet);
        const recipientAta = await getOrCreateAssociatedTokenAccount(conn, treasury, new PublicKey(TOKEN_MINT), recipientPk);
        const treasuryAta = await getOrCreateAssociatedTokenAccount(conn, treasury, new PublicKey(TOKEN_MINT), treasury.publicKey);
        tx.add(createTransferInstruction(treasuryAta.address, recipientAta.address, treasury.publicKey, alloc.share));
        ataInstructions.push({ wallet: alloc.wallet });
      } catch (e: any) {
        console.error("  Failed to prepare " + alloc.wallet.slice(0, 8) + "...: " + e.message);
        results.push({ wallet: alloc.wallet, error: e.message });
        failed++;
      }
    }

    if (tx.instructions.length === 0) continue;

    try {
      const sig = await sendAndConfirmTransaction(conn, tx, [treasury]);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allocations.length / BATCH_SIZE);
      console.log("Batch " + batchNum + "/" + totalBatches + " confirmed: https://solscan.io/tx/" + sig);
      for (const a of ataInstructions) {
        results.push({ wallet: a.wallet, sig });
        success++;
      }
    } catch (e: any) {
      console.error("  Batch failed: " + e.message);
      for (const a of ataInstructions) {
        results.push({ wallet: a.wallet, error: e.message });
        failed++;
      }
    }
  }

  console.log("\nKOL AIRDROP COMPLETE");
  console.log("Successful: " + success + "/" + KOL_WALLETS.length);
  if (failed > 0) console.log("Failed: " + failed + " - re-run to retry");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error("Error: " + (e.message || JSON.stringify(e)));
  process.exit(1);
});
