/**
 * Redis-backed store using Upstash.
 * Falls back to local JSON files when UPSTASH env vars are not set (local dev).
 */
import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Meeting = {
  id: string;
  title: string;
  description: string;
  options: string[];
  createdAt: number;
  endsAt: number;
  createdBy: string;
};

export type Vote = {
  meetingId: string;
  wallet: string;
  choice: number;
  weight: number;
  signature: string;
  signedMessage: string;
  timestamp: number;
};

export type Distribution = {
  id: string;
  createdAt: number;
  tokenMint: string;
  tokenSymbol: string;
  totalAmount: string;
  snapshotBlock?: number;
  merkleRoot: string;
  proofs: Record<string, { amount: string; proof: string[] }>;
  claimed: string[];
};

export type Employee = {
  wallet: string;
  handle: string;
  title: string;
  allocation: number;
  hiredAt: number;
  status: "active" | "fired";
};

// ── Redis client ──────────────────────────────────────────────────────────────

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// ── Public async API (used by all API routes) ─────────────────────────────────

export async function readData<T>(key: string, fallback: T): Promise<T> {
  const redis = getRedis();
  if (redis) {
    try {
      const val = await redis.get<T>(key);
      return val ?? fallback;
    } catch {
      return fallback;
    }
  }
  return readJson<T>(`${key}.json`, fallback);
}

export async function writeData(key: string, data: unknown): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(key, data);
    return;
  }
  writeJson(`${key}.json`, data);
}

// ── Local JSON helpers (local dev only) ───────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function readJson<T>(file: string, fallback: T): T {
  ensureDir();
  const fp = path.join(DATA_DIR, file);
  if (!fs.existsSync(fp)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(fp, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(file: string, data: unknown) {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}
