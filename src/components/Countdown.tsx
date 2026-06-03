import { useEffect, useState } from 'react';

function format(secs: number): string {
  if (secs <= 0) return '00:00:00';
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return d > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Live countdown to a unix timestamp (seconds). */
export function Countdown({ to, className }: { to: number; className?: string }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = to - now;
  return <span className={className}>{remaining > 0 ? format(remaining) : 'Closed'}</span>;
}
