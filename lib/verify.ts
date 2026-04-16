import nacl from "tweetnacl";
import bs58 from "bs58";
import { PublicKey } from "@solana/web3.js";

/**
 * Verify a base58-encoded ed25519 signature on a message, produced by a Solana wallet.
 */
export function verifySignature(message: string, signatureB58: string, walletAddr: string): boolean {
  try {
    const msg = new TextEncoder().encode(message);
    const sig = bs58.decode(signatureB58);
    const pub = new PublicKey(walletAddr).toBytes();
    return nacl.sign.detached.verify(msg, sig, pub);
  } catch {
    return false;
  }
}
