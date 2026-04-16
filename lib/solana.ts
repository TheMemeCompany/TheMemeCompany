import { Connection, PublicKey } from "@solana/web3.js";

export function getConnection() {
  const rpc = process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com";
  return new Connection(rpc, "confirmed");
}

/**
 * Fetch top N holders of an SPL token using Helius enhanced RPC.
 * Falls back to getProgramAccounts on public RPC (slow, may rate-limit).
 */
export async function fetchTopHolders(mint: string, topN: number = 100): Promise<Array<{ owner: string; amount: number }>> {
  const heliusKey = process.env.HELIUS_API_KEY;
  if (heliusKey) {
    const url = `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
    // Helius getTokenAccounts endpoint - paginated
    const holders: Record<string, number> = {};
    let cursor: string | undefined;
    for (let i = 0; i < 20; i++) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "1",
          method: "getTokenAccounts",
          params: { mint, limit: 1000, cursor },
        }),
      });
      const data = await res.json();
      const accounts = data?.result?.token_accounts || [];
      for (const a of accounts) {
        holders[a.owner] = (holders[a.owner] || 0) + Number(a.amount);
      }
      cursor = data?.result?.cursor;
      if (!cursor || accounts.length === 0) break;
    }
    return Object.entries(holders)
      .map(([owner, amount]) => ({ owner, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, topN);
  }

  // Fallback: public RPC, uses getProgramAccounts. Will be slow/rate-limited for popular tokens.
  const conn = getConnection();
  const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
  const accs = await conn.getParsedProgramAccounts(TOKEN_PROGRAM, {
    filters: [
      { dataSize: 165 },
      { memcmp: { offset: 0, bytes: mint } },
    ],
  });
  const holders: Record<string, number> = {};
  for (const a of accs) {
    const info: any = a.account.data;
    const owner = info.parsed?.info?.owner;
    const amt = Number(info.parsed?.info?.tokenAmount?.amount || 0);
    if (owner) holders[owner] = (holders[owner] || 0) + amt;
  }
  return Object.entries(holders)
    .map(([owner, amount]) => ({ owner, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, topN);
}

/**
 * Get a single wallet's balance of a token.
 */
export async function getTokenBalance(wallet: string, mint: string): Promise<number> {
  const conn = getConnection();
  const ownerPk = new PublicKey(wallet);
  const mintPk = new PublicKey(mint);
  const accs = await conn.getParsedTokenAccountsByOwner(ownerPk, { mint: mintPk });
  let total = 0;
  for (const acc of accs.value) {
    total += Number(acc.account.data.parsed.info.tokenAmount.amount);
  }
  return total;
}

/**
 * Total supply of a token.
 */
export async function getTotalSupply(mint: string): Promise<number> {
  const conn = getConnection();
  const info = await conn.getTokenSupply(new PublicKey(mint));
  return Number(info.value.amount);
}
