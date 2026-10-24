// The web UI is served next to the RPC endpoint. A reverse proxy keeps that
// pair on one origin. Building http://localhost:9091 here sends the browser
// somewhere else.

export interface RpcEndpoint {
  host?: string;
  port?: number | string;
  https?: boolean;
  path?: string;
}

export interface PageLocation {
  href: string;
  protocol: string;
  hostname: string;
  port: string;
}

const DEFAULT_PATH = "/transmission/rpc";

export function normalizeRpcPath(path?: string): string {
  if (!path) return DEFAULT_PATH;
  return path.startsWith("/") ? path : "/" + path;
}

function hostKey(host: string): string {
  return host.trim().replace(/^\[|\]$/g, "").toLowerCase();
}

function pageIsHttps(page: PageLocation): boolean {
  return page.protocol === "https:";
}

function pagePort(page: PageLocation): string {
  if (page.port) return String(page.port);
  return pageIsHttps(page) ? "443" : "80";
}

function portProvided(port: RpcEndpoint["port"]): boolean {
  return port !== undefined && port !== null && String(port) !== "";
}

export function resolveEndpoint(input: RpcEndpoint, page?: PageLocation): RpcEndpoint {
  const path = normalizeRpcPath(input.path);
  const host = typeof input.host === "string" ? input.host.trim() : "";
  const followsPage = !!page && (host === "" || hostKey(host) === hostKey(page.hostname));
  const samePort = followsPage && (!portProvided(input.port) || String(input.port) === pagePort(page as PageLocation));
  if (page && samePort) {
    const https = pageIsHttps(page);
    return {
      host: page.hostname,
      port: pagePort(page),
      https,
      path,
    };
  }
  const https = !!input.https;
  return {
    host: host || "localhost",
    port: portProvided(input.port) ? input.port : (https ? 443 : 9091),
    https,
    path,
  };
}

export function isSameOrigin(endpoint: RpcEndpoint, page: PageLocation): boolean {
  if (!endpoint.host || hostKey(endpoint.host) !== hostKey(page.hostname)) return false;
  return String(endpoint.port ?? "") === pagePort(page);
}

// /transmission/web/ and /transmission/rpc are siblings. A proxy that mounts
// that pair under a prefix still has rpc next to web.
export function sameOriginRpcPath(path: string, pageHref: string): string {
  if (path !== DEFAULT_PATH) return path;
  const page = new URL(pageHref);
  let pathname = page.pathname;
  if (pathname.endsWith("/web")) pathname += "/";
  const webAt = pathname.lastIndexOf("/web/");
  if (webAt === -1) return path;
  const directory = pathname.slice(0, webAt + "/web/".length);
  return new URL("../rpc", page.origin + directory).pathname;
}

export function rpcRequestUrl(input: RpcEndpoint, page?: PageLocation): string {
  const endpoint = resolveEndpoint(input, page);
  const path = normalizeRpcPath(endpoint.path);
  if (page && isSameOrigin(endpoint, page)) {
    return sameOriginRpcPath(path, page.href);
  }
  const https = !!endpoint.https;
  const port = String(endpoint.port ?? (https ? 443 : 9091));
  const host = endpoint.host || "localhost";
  const bracketed = host.includes(":") && !host.startsWith("[") ? "[" + host + "]" : host;
  const omitPort = (https && port === "443") || (!https && port === "80");
  return (https ? "https://" : "http://") + bracketed + (omitPort ? "" : ":" + port) + path;
}
