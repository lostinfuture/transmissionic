export const EGRESS_ENDPOINT = "./egress.json";
export const IP_API_URL =
  "http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,isp,query";

export interface EgressInfo {
  ip: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  isp: string;
}

export type FetchLike = (
  input: string,
  init?: RequestInit
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseIpApiPayload(raw: unknown): EgressInfo | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  if (obj.status !== "success") {
    return null;
  }
  const ip = cleanString(obj.query);
  if (!ip) {
    return null;
  }
  return {
    ip,
    city: cleanString(obj.city),
    region: cleanString(obj.regionName) || cleanString(obj.region),
    country: cleanString(obj.country),
    countryCode: cleanString(obj.countryCode),
    isp: cleanString(obj.isp),
  };
}

export function formatEgressLocation(info: EgressInfo | null): string {
  if (!info) {
    return "";
  }
  const primary = info.city || info.region;
  const country = info.country || info.countryCode;
  if (primary && country && primary.toLowerCase() !== country.toLowerCase()) {
    return `${primary}, ${country}`;
  }
  return primary || country;
}

export function formatEgressTitle(info: EgressInfo | null): string {
  if (!info) {
    return "";
  }
  const parts: string[] = [];
  if (info.city) {
    parts.push(info.city);
  }
  if (info.region && info.region.toLowerCase() !== info.city.toLowerCase()) {
    parts.push(info.region);
  }
  const country = info.country || info.countryCode;
  if (country && !parts.some((p) => p.toLowerCase() === country.toLowerCase())) {
    parts.push(country);
  }
  const loc = parts.join(", ");
  if (loc && info.isp) {
    return `${loc} (${info.isp})`;
  }
  return loc || info.isp;
}

export async function fetchEgressInfo(
  fetcher: FetchLike = (input, init) => fetch(input, init),
  pageProtocol: string = typeof window !== "undefined" ? window.location.protocol : "http:"
): Promise<EgressInfo | null> {
  try {
    const local = await fetcher(EGRESS_ENDPOINT, { cache: "no-store" });
    if (local.ok) {
      const payload = await local.json();
      return parseIpApiPayload(payload);
    }
    if (local.status !== 404) {
      return null;
    }
  } catch {
    return null;
  }

  // Free ip-api.com JSON endpoint is HTTP-only; avoid mixed-content errors on HTTPS pages.
  if (pageProtocol !== "http:") {
    return null;
  }

  try {
    const res = await fetcher(IP_API_URL, { cache: "no-store" });
    if (!res.ok) {
      return null;
    }
    const payload = await res.json();
    return parseIpApiPayload(payload);
  } catch {
    return null;
  }
}
