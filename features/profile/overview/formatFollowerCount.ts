const UNITS = [
  { value: 1_000_000_000, suffix: 'B' },
  { value: 1_000_000, suffix: 'M' },
  { value: 1_000, suffix: 'K' },
];

/** Instagram-style count: 999 -> "999", 1500 -> "1.5K", 1200000 -> "1.2M". Returns '' if invalid. */
export function formatFollowerCount(count: number | string): string {
  const n = Number(count);
  if (count === '' || !Number.isFinite(n) || n < 0) return '';

  const unit = UNITS.find((u) => n >= u.value);
  if (!unit) return String(Math.floor(n));

  // Truncate (not round) to one decimal, like Instagram: 1999 -> "1.9K".
  return `${Math.floor(n / (unit.value / 10)) / 10}${unit.suffix}`;
}
