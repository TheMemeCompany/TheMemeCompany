# The Meme Company

A decentralized meme fund. $MEME fees → community-voted token purchases → pro-rata distributions to the top 100 holders.

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind
- Solana wallet adapter (Phantom, Solflare)
- Off-chain Snapshot-style voting (ed25519 sig verification)
- Merkle-tree claim distributions
- JSON-file storage (swap for Supabase/Postgres for prod)

## Pages
| Route | Purpose |
|---|---|
| `/` | Prospectus + live token dashboard (price, MC, holders, treasury) |
| `/employees` | KOL roster with titles, handles, allocations |
| `/meetings` | 24h shareholder votes, 0.05% supply gated |
| `/claim` | Holders check and claim their distributions |
| `/admin` | Open meetings, snapshot + distribute, hire/fire |

## The mechanics

1. **Launch** — token launches, 10% reserved for 10 KOL employees (1% each), 10% for future hires.
2. **Fees accumulate** in the treasury wallet (tracked live on `/`).
3. **Shareholders meet** — admin opens a 24h vote with 2+ token candidates. Holders with ≥0.05% supply sign a message with their wallet to cast a weighted vote (weight = token balance at time of voting).
4. **Winning token bought** — admin manually purchases with treasury (Jupiter, Raydium — your call).
5. **Snapshot + distribute** — admin hits "Snapshot top 100 holders," enters distributed token amount, the system builds a merkle tree with pro-rata allocations.
6. **Claim** — top 100 come to `/claim`, see what they're owed, register their claim. Treasury then bulk-sends the actual tokens (or later, claim from a vault contract).

## Setup

```bash
npm install
cp .env.example .env.local
# fill in NEXT_PUBLIC_TOKEN_MINT, NEXT_PUBLIC_TREASURY_WALLET, HELIUS_API_KEY, ADMIN_WALLETS
npm run dev
```

### Environment variables
- `NEXT_PUBLIC_TOKEN_MINT` — $MEME mint address (set after token launch)
- `NEXT_PUBLIC_TREASURY_WALLET` — wallet that collects fees and sends distributions
- `NEXT_PUBLIC_RPC_URL` — paid Solana RPC recommended (Helius/QuickNode)
- `HELIUS_API_KEY` — required for fast holder snapshots; without it, free-RPC fallback is slow
- `ADMIN_WALLETS` — comma-separated list of wallets allowed to open meetings / create distributions
- `NEXT_PUBLIC_VOTING_THRESHOLD` — defaults to 0.0005 (0.05%)
- `NEXT_PUBLIC_TOP_HOLDERS_COUNT` — defaults to 100

## Deploy

Vercel is easiest:
```bash
npx vercel
```
Set env vars in Vercel project settings. The JSON file store works on Vercel for low-write use cases, but if voting/claim volume grows, migrate `lib/store.ts` to Supabase.

## What's still manual (by design, for v1)
- **Purchasing the voted token** — run it yourself through Jupiter/Raydium after the meeting closes. You can automate via Jupiter API later.
- **Sending distributions** — after "publish distribution" builds the merkle tree, you currently send the tokens in a batch from the treasury to whoever claims. Next iteration: deploy an Anchor program with a claim vault so it's fully trustless.

## Roadmap (post-launch)
- [ ] Anchor program for on-chain merkle claim vault (users claim directly, no manual send)
- [ ] Jupiter swap API integration in admin — "Execute winning vote" button
- [ ] Telegram bot for meeting alerts to holders
- [ ] Leaderboard of historical picks and their ROI (big marketing angle)
- [ ] Employee performance metrics pulled from X (impressions, shill volume) to justify the 10% hiring pool

## Security notes
- Voting signatures prevent impersonation — only the wallet owner can cast a vote.
- Admin-gated mutations (meetings, distributions, employees) require admin wallet + signature.
- Vote weight snapshots at time of voting, not meeting start — whales can't buy in mid-vote without signing a new transaction.
- For the claim page, remember: in v1 the actual token transfer is executed by you. Don't promise holders instant on-chain claims until you deploy the vault contract.
