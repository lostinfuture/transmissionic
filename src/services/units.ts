export interface ByteUnits {
  base: number;
  labels: readonly string[];
}

const DEFAULT_UNITS: Record<"size" | "speed" | "memory", ByteUnits> = {
  // 4.1.4 session-get defaults. size and speed are decimal; memory is binary.
  size: { base: 1000, labels: ["B", "kB", "MB", "GB", "TB"] },
  speed: { base: 1000, labels: ["B/s", "kB/s", "MB/s", "GB/s", "TB/s"] },
  memory: { base: 1024, labels: ["B", "KiB", "MiB", "GiB", "TiB"] },
};

export function readByteUnits(units: Record<string, any> | undefined, kind: "size" | "speed" | "memory"): ByteUnits {
  const fallback = DEFAULT_UNITS[kind];
  if (!units) return fallback;
  const base = units[kind + "-bytes"] ?? units[kind + "_bytes"];
  const labels = units[kind + "-units"] ?? units[kind + "_units"];
  if (typeof base !== "number" || base <= 1 || !Array.isArray(labels) || labels.length === 0) {
    return fallback;
  }
  // Transmission 4.0.x lists units from kilo up (["kB", "MB", ...]); 4.1 starts at bytes.
  // Without a bytes label every value prints one step (1000x) too large.
  if (!/^B/i.test(String(labels[0]))) {
    return { base, labels: [fallback.labels[0], ...labels] };
  }
  return { base, labels };
}

export function formatByteCount(bytes: number, spec: ByteUnits, decimals: number, locale?: string): string {
  const abs = Math.abs(bytes);
  let value = abs;
  let index = 0;
  const last = spec.labels.length - 1;
  while (value >= spec.base && index < last) {
    value /= spec.base;
    index += 1;
  }
  const shown = value.toLocaleString(locale, { maximumFractionDigits: decimals < 0 ? 0 : decimals });
  return (bytes < 0 ? "-" : "") + shown + " " + spec.labels[index];
}
