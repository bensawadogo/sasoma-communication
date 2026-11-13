import { serverToken } from '../transport/serverToken.js';

export interface TokenTotals {
  total: number;
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
  messages: number;
}

export interface ProviderReport {
  id: string;
  label: string;
  connected: boolean;
  fiveHour: TokenTotals;
  today: TokenTotals;
  week: TokenTotals;
  byModel: Array<{ model: string; today: TokenTotals }>;
  budget?: { fiveHourTokens?: number; dailyTokens?: number };
}

export interface TokenReport {
  generatedAt: number;
  providers: ProviderReport[];
}

export const hasTokenAccess = serverToken !== null;

export async function fetchTokens(signal?: AbortSignal): Promise<TokenReport | null> {
  if (!hasTokenAccess) return null;
  const res = await fetch('/api/tokens', { headers: { Authorization: `Bearer ${serverToken ?? ''}` }, signal });
  if (!res.ok) return null;
  const data = (await res.json()) as { ok?: boolean } & Partial<TokenReport>;
  return data.providers ? (data as TokenReport) : null;
}

/** 1234 -> "1,2 k", 1500000 -> "1,5 M". Small numbers stay whole. */
export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M`;
  if (n >= 10_000) return `${Math.round(n / 1000)} k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',')} k`;
  return String(n);
}
