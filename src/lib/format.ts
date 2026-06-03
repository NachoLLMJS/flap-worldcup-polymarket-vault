/** Truncate an EVM address to `0x1234…abcd`, or a friendly fallback. */
export function shortAddress(address?: string): string {
  if (!address) return 'Not configured';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Format a BNB number with a fixed number of decimals (default 5). */
export function formatBnb(value: number, decimals = 5): string {
  return Number.isFinite(value) ? value.toFixed(decimals) : (0).toFixed(decimals);
}
