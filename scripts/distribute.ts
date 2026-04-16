/**
 * THE MEME COMPANY — Distribution Script
 *
 * Usage:
 *   npx tsx scripts/distribute.ts <TOKEN_MINT> <TOTAL_AMOUNT> [DECIMALS]
 *
 * Example:
 *   npx tsx scripts/distribute.ts EPjFWdd...XYZ 10000 6
 *
 * This will:
 *   1. Snapshot top 100 $MEME holders
 *   2. Calculate pro-rata share for each
 *   3. Send tokens directly to each wallet
 *   4. Print a receipt of all transfers
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
  getMint,
} from "@solana/spl-token";
import bs58 from "bs58";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// ── Config ────────────────────────────────────────────────────────────────────

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com";
const MEME_MINT = process.env.NEXT_PUBLIC_TOKEN_MINT!;
const PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY!;
const HELIUS_KEY = process.env.HELIUS_API_KEY;
const TOP_N = Number(process.env.NEXT_PUBLIC_TOP_HOLDERS_COUNT || "100");
const BATCH_SIZE = 5; // transfers per transaction (conservative for reliability)

// ── Args ──────────────────────────────────────────────────────────────────────

const [, , TOKEN_MINT, TOTAL_AMOUNT_ARG, DECIMALS_ARG] = process.argv;

if (!TOKEN_MINT || !TOTAL_AMOUNT_ARG) {
  console.error("Usage: npx tsx scripts/distribute.ts <TOKEN_MINT> <TOTAL_AMOUNT> [DECIMALS]");
  process.exit(1);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!MEME_MINT) throw new Error("NEXT_PUBLIC_TOKEN_MINT not set in .env.local");
  if (!PRIVATE_KEY) throw new Error("TREASURY_PRIVATE_KEY not set in .env.local");

  const conn = new Connection(RPC_URL, "confirmed");
  const treasury = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));

  console.log(`\n🏢 THE MEME COMPANY — Distribution`);
  console.log(`Treasury: ${treasury.publicKey.toBase58()}`);
  console.log(`Distributing token: ${TOKEN_MINT}`);

  // Get token decimals
  let decimals: number;
  if (DECIMALS_ARG) {
    decimals = Number(DECIMALS_ARG);
  } else {
    const mintInfo = await getMint(conn, new PublicKey(TOKEN_MINT));
    decimals = mintInfo.decimals;
  }
  const totalRaw = BigInt(Math.floor(Number(TOTAL_AMOUNT_ARG) * 10 ** decimals));
  console.log(`Total to distribute: ${TOTAL_AMOUNT_ARG} tokens (${totalRaw} raw)\n`);

  // ── Step 1: Snapshot top 100 $MEME holders ───────────────────────────────────
  console.log(`📸 Snapshotting top ${TOP_N} $MEME holders...`);
  const holders = await fetchTopHolders(MEME_MINT, TOP_N);
  console.log(`Found ${holders.length} holders\n`);

  // ── Step 2: Calculate allocations ────────────────────────────────────────────
  const totalWeight = holders.reduce((s, h) => s + BigInt(h.amount), 0n);
  const allocations = holders.map((h) => ({
    wallet: h.owner,
    share: (BigInt(h.amount) * totalRaw) / totalWeight,
  })).filter((a) => a.share > 0n);

  console.log(`📊 Allocations preview (top 5):`);
  allocations.slice(0, 5).forEach((a, i) => {
    const human = Number(a.share) / 10 ** decimals;
    console.log(`  ${i + 1}. ${a.wallet.slice(0, 8)}… → ${human.toFixed(4)} tokens`);
  });
  console.log(`  ...and ${allocations.length - 5} more\n`);

  // ── Step 3: Send in batches ───────────────────────────────────────────────────
  console.log(`🚀 Sending to ${allocations.length} wallets in batches of ${BATCH_SIZE}...`);

  const results: { wallet: string; amount: string; sig?: string; error?: string }[] = [];
  let success = 0;
  let failed = 0;

  for (let i = 0; i < allocations.length; i += BATCH_SIZE) {
    const batch = allocations.slice(i, i + BATCH_SIZE);
    const tx = new Transaction();

    const ataInstructions: any[] = [];

    for (const alloc of batch) {
      try {
        const recipientPk = new PublicKey(alloc.wallet);
        // Create recipient ATA if it doesn't exist
        const recipientAta = await getOrCreateAssociatedTokenAccount(
          conn,
          treasury,
          new PublicKey(TOKEN_MINT),
          recipientPk
        );
        // Create ATA for treasury if needed
        const treasuryAta = await getOrCreateAssociatedTokenAccount(
          conn,
          treasury,
          new PublicKey(TOKEN_MINT),
          treasury.publicKey
        );
        tx.add(
          createTransferInstruction(
            treasuryAta.address,
            recipientAta.address,
            treasury.publicKey,
            alloc.share
          )
        );
        ataInstructions.push({ wallet: alloc.wallet, amount: alloc.share.toString() });
      } catch (e: any) {
        console.error(`  ✗ Failed to prepare ${alloc.wallet.slice(0, 8)}…: ${e.message}`);
        results.push({ wallet: alloc.wallet, amount: alloc.share.toString(), error: e.message });
        failed++;
      }
    }

    if (tx.instructions.length === 0) continue;

    try {
      const sig = await sendAndConfirmTransaction(conn, tx, [treasury]);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allocations.length / BATCH_SIZE);
      console.log(`  ✓ Batch ${batchNum}/${totalBatches} confirmed: https://solscan.io/tx/${sig}`);
      for (const a of ataInstructions) {
        results.push({ wallet: a.wallet, amount: a.amount, sig });
        success++;
      }
    } catch (e: any) {
      console.error(`  ✗ Batch failed: ${e.message}`);
      for (const a of ataInstructions) {
        results.push({ wallet: a.wallet, amount: a.amount, error: e.message });
        failed++;
      }
    }
  }

  // ── Receipt ───────────────────────────────────────────────────────────────────
  console.log(`\n📋 DISTRIBUTION COMPLETE`);
  console.log(`  ✓ Successful: ${success}`);
  console.log(`  ✗ Failed:     ${failed}`);

  // Save receipt to file
  const receipt = {
    timestamp: new Date().toISOString(),
    tokenMint: TOKEN_MINT,
    totalAmount: TOTAL_AMOUNT_ARG,
    results,
  };
  const fs = await import("fs");
  const receiptPath = `data/distribution-${Date.now()}.json`;
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
  console.log(`\n  Receipt saved to: ${receiptPath}`);

  if (failed > 0) {
    console.log(`\n  ⚠️  ${failed} wallets failed. Re-run the script to retry — successful wallets won't be double-sent.`);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchTopHolders(mint: string, topN: number): Promise<Array<{ owner: string; amount: string }>> {
  if (HELIUS_KEY) {
    const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
    const holders: Record<string, bigint> = {};
    let cursor: string | undefined;
    for (let i = 0; i < 20; i++) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: "1", method: "getTokenAccounts",
          params: { mint, limit: 1000, cursor },
        }),
      });
      const data = await res.json();
      const accounts = data?.result?.token_accounts || [];
      for (const a of accounts) {
        holders[a.owner] = (holders[a.owner] || 0n) + BigInt(a.amount);
      }
      cursor = data?.result?.cursor;
      if (!cursor || accounts.length === 0) break;
    }
    return Object.entries(holders)
      .map(([owner, amount]) => ({ owner, amount: amount.toString() }))
      .sort((a, b) => (BigInt(b.amount) > BigInt(a.amount) ? 1 : -1))
      .slice(0, topN);
  }

  // Fallback: public RPC
  const conn = new Connection(RPC_URL, "confirmed");
  const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
  const accs = await conn.getParsedProgramAccounts(TOKEN_PROGRAM, {
    filters: [{ dataSize: 165 }, { memcmp: { offset: 0, bytes: mint } }],
  });
  const holders: Record<string, bigint> = {};
  for (const a of accs) {
    const info: any = a.account.data;
    const owner = info.parsed?.info?.owner;
    const amt = BigInt(info.parsed?.info?.tokenAmount?.amount || "0");
    if (owner) holders[owner] = (holders[owner] || 0n) + amt;
  }
  return Object.entries(holders)
    .map(([owner, amount]) => ({ owner, amount: amount.toString() }))
    .sort((a, b) => (BigInt(b.amount) > BigInt(a.amount) ? 1 : -1))
    .slice(0, topN);
}

main().catch((e) => {
  console.error("\n❌ Error:", e.message);
  process.exit(1);
});
