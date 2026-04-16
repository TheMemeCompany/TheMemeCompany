import { MerkleTree } from "merkletreejs";
import { createHash } from "crypto";

export type ClaimLeaf = { wallet: string; amount: string }; // amount as string (raw base units)

function sha256(data: Buffer | string): Buffer {
  return createHash("sha256").update(data).digest();
}

export function hashLeaf(leaf: ClaimLeaf): Buffer {
  return sha256(`${leaf.wallet}:${leaf.amount}`);
}

export function buildMerkleTree(leaves: ClaimLeaf[]) {
  const hashed = leaves.map(hashLeaf);
  const tree = new MerkleTree(hashed, sha256, { sortPairs: true });
  const root = tree.getHexRoot();
  const proofs: Record<string, { amount: string; proof: string[] }> = {};
  for (const l of leaves) {
    proofs[l.wallet] = {
      amount: l.amount,
      proof: tree.getHexProof(hashLeaf(l)),
    };
  }
  return { root, proofs };
}

export function verifyProof(leaf: ClaimLeaf, proof: string[], root: string): boolean {
  const hashed = hashLeaf(leaf);
  const tree = new MerkleTree([], sha256, { sortPairs: true });
  return tree.verify(proof, hashed, root);
}
