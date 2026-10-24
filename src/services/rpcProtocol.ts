// Transmission 4.1 speaks JSON-RPC 2.0 with snake_case. The Vue screens still
// read the legacy names (percentDone, download-dir, cache-size-mb).

const OUTGOING_ALIASES: Record<string, string> = {
  // 4.1 renamed this key. It is not a hyphen-to-underscore conversion.
  "cache-size-mb": "cache_size_mib",
};

export function toSnake(key: string): string {
  let out = "";
  for (let i = 0; i < key.length; i++) {
    const char = key[i];
    if (char === "-") {
      out += "_";
    } else if (char >= "A" && char <= "Z" && i > 0 && /[a-z0-9]/.test(key[i - 1])) {
      out += "_" + char.toLowerCase();
    } else {
      out += char.toLowerCase();
    }
  }
  return out;
}

export function snakeKey(key: string): string {
  return OUTGOING_ALIASES[key] || toSnake(key);
}

function reverseMap(legacyNames: readonly string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const name of legacyNames) {
    const snake = snakeKey(name);
    if (snake !== name) {
      map[snake] = name;
    }
  }
  return map;
}

const SESSION_NAMES = [
  "alt-speed-down", "alt-speed-enabled", "alt-speed-time-begin", "alt-speed-time-day",
  "alt-speed-time-enabled", "alt-speed-time-end", "alt-speed-up",
  "anti-brute-force-enabled", "anti-brute-force-threshold",
  "blocklist-enabled", "blocklist-size", "blocklist-url",
  "cache-size-mb", "config-dir", "default-trackers", "dht-enabled",
  "download-dir", "download-dir-free-space", "download-queue-enabled", "download-queue-size",
  "encryption", "idle-seeding-limit", "idle-seeding-limit-enabled",
  "incomplete-dir", "incomplete-dir-enabled", "lpd-enabled",
  "peer-limit-global", "peer-limit-per-torrent", "peer-port", "peer-port-random-on-start",
  "pex-enabled", "port-forwarding-enabled", "preferred_transports",
  "queue-stalled-enabled", "queue-stalled-minutes", "rename-partial-files", "reqq",
  "rpc-version", "rpc-version-minimum", "rpc-version-semver",
  "script-torrent-added-enabled", "script-torrent-added-filename",
  "script-torrent-done-enabled", "script-torrent-done-filename",
  "script-torrent-done-seeding-enabled", "script-torrent-done-seeding-filename",
  "seed-queue-enabled", "seed-queue-size", "seedRatioLimit", "seedRatioLimited",
  "sequential_download", "session-id",
  "speed-limit-down", "speed-limit-down-enabled", "speed-limit-up", "speed-limit-up-enabled",
  "start-added-torrents", "tcp-enabled", "trash-original-torrent-files", "units",
  "utp-enabled", "version",
];

const UNIT_NAMES = [
  "memory-bytes", "memory-units", "size-bytes", "size-units", "speed-bytes", "speed-units",
];

const TORRENT_NAMES = [
  "id", "name", "percentDone", "uploadRatio", "rateDownload", "rateUpload",
  "downloadedEver", "uploadedEver", "totalSize", "addedDate", "status", "errorString",
  "activityDate", "sizeWhenDone", "eta", "recheckProgress", "queuePosition", "downloadDir",
  "leftUntilDone", "comment", "creator", "dateCreated", "magnetLink", "hashString",
  "secondsDownloading", "secondsSeeding", "pieceCount", "pieceSize", "files", "fileStats",
  "doneDate", "downloadLimit", "downloadLimited", "uploadLimit", "uploadLimited",
  "peer-limit", "seedRatioLimit", "seedRatioMode", "seedIdleLimit", "seedIdleMode",
  "bandwidthPriority", "trackers", "trackerStats", "peers",
];

const FILE_NAMES = ["bytesCompleted", "begin_piece", "end_piece", "length", "name"];
const FILE_STAT_NAMES = ["bytesCompleted", "priority", "wanted"];
const TRACKER_STAT_NAMES = [
  "announce", "announceState", "downloadCount", "downloader_count", "hasAnnounced", "hasScraped",
  "host", "id", "isBackup", "lastAnnouncePeerCount", "lastAnnounceResult", "lastAnnounceStartTime",
  "lastAnnounceSucceeded", "lastAnnounceTime", "lastAnnounceTimedOut", "lastScrapeResult",
  "lastScrapeStartTime", "lastScrapeSucceeded", "lastScrapeTime", "lastScrapeTimedOut",
  "leecherCount", "nextAnnounceTime", "nextScrapeTime", "scrape", "scrapeState", "seederCount",
  "sitename", "tier",
];
const PEER_NAMES = [
  "address", "clientName", "flagStr", "isEncrypted", "port", "progress",
  "rateToClient", "rateToPeer",
];
const STATS_NAMES = [
  "activeTorrentCount", "cumulative-stats", "current-stats", "downloadSpeed",
  "pausedTorrentCount", "torrentCount", "uploadSpeed",
];
const STATS_BUCKET_NAMES = [
  "downloadedBytes", "filesAdded", "secondsActive", "sessionCount", "uploadedBytes",
];
const ADD_NAMES = ["torrent-added", "torrent-duplicate"];
const ADD_TORRENT_NAMES = ["hashString", "id", "name"];
const FREE_SPACE_NAMES = ["path", "size-bytes", "total_size"];

const sessionMap = reverseMap(SESSION_NAMES);
const unitsMap = reverseMap(UNIT_NAMES);
const torrentMap = reverseMap(TORRENT_NAMES);
const fileMap = reverseMap(FILE_NAMES);
const fileStatMap = reverseMap(FILE_STAT_NAMES);
const trackerStatMap = reverseMap(TRACKER_STAT_NAMES);
const peerMap = reverseMap(PEER_NAMES);
const statsMap = reverseMap(STATS_NAMES);
const statsBucketMap = reverseMap(STATS_BUCKET_NAMES);
const addMap = reverseMap(ADD_NAMES);
const addTorrentMap = reverseMap(ADD_TORRENT_NAMES);
const freeSpaceMap = reverseMap(FREE_SPACE_NAMES);

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function renameObject(
  value: any,
  map: Record<string, string>,
  childMaps: Record<string, Record<string, string>> = {}
): any {
  if (Array.isArray(value)) {
    return value.map((item) => isRecord(item) ? renameObject(item, map, childMaps) : item);
  }
  if (!isRecord(value)) return value;
  const out: Record<string, any> = {};
  for (const [key, child] of Object.entries(value)) {
    const legacy = map[key] || key;
    const nested = childMaps[legacy];
    if (nested) {
      out[legacy] = renameObject(child, nested);
    } else {
      out[legacy] = child;
    }
  }
  return out;
}

function restoreTorrentValue(field: string, value: any): any {
  if (field === "files") return renameObject(value, fileMap);
  if (field === "fileStats") return renameObject(value, fileStatMap);
  if (field === "trackerStats") return renameObject(value, trackerStatMap);
  if (field === "peers") return renameObject(value, peerMap);
  return value;
}

function restoreTorrentGet(result: Record<string, any>): Record<string, any> {
  const torrents = result.torrents;
  if (!Array.isArray(torrents)) return result;
  if (torrents.length > 0 && Array.isArray(torrents[0])) {
    const header = torrents[0].map((name: string) => torrentMap[name] || name);
    const rows = torrents.slice(1).map((row: any[]) => row.map((cell, index) => {
      return restoreTorrentValue(header[index], cell);
    }));
    return {
      ...result,
      torrents: [header, ...rows],
    };
  }
  return {
    ...result,
    torrents: torrents.map((torrent) => renameObject(torrent, torrentMap, {
      files: fileMap,
      fileStats: fileStatMap,
      trackerStats: trackerStatMap,
      peers: peerMap,
    })),
  };
}

export function restoreArguments(method: string, result: any): any {
  if (!isRecord(result)) return {};
  if (method === "session-get" || method === "session-set" || method === "blocklist-update") {
    return renameObject(result, sessionMap, { units: unitsMap });
  }
  if (method === "session-stats") {
    return renameObject(result, statsMap, {
      "current-stats": statsBucketMap,
      "cumulative-stats": statsBucketMap,
    });
  }
  if (method === "free-space") return renameObject(result, freeSpaceMap);
  if (method === "torrent-get") return restoreTorrentGet(result);
  if (method === "torrent-add") {
    return renameObject(result, addMap, {
      "torrent-added": addTorrentMap,
      "torrent-duplicate": addTorrentMap,
    });
  }
  return result;
}

export function encodeParams(value: any, key?: string): any {
  if (Array.isArray(value)) {
    if (key === "fields") {
      return value.map((item) => typeof item === "string" ? snakeKey(item) : item);
    }
    return value.map((item) => encodeParams(item));
  }
  if (!isRecord(value)) return value;
  const out: Record<string, any> = {};
  for (const [rawKey, child] of Object.entries(value)) {
    const snake = snakeKey(rawKey);
    let next = child;
    if (snake === "ids" && child === "recently-active") {
      next = "recently_active";
    }
    out[snake] = encodeParams(next, snake);
  }
  return out;
}

export function buildRequest(method: string, args: Record<string, any>, id: number, jsonrpc: boolean): Record<string, any> {
  if (!jsonrpc) {
    return {
      method,
      arguments: args,
      tag: id,
    };
  }
  return {
    jsonrpc: "2.0",
    method: snakeKey(method),
    params: encodeParams(args),
    id,
  };
}

// A pre-4.1 daemon ignores jsonrpc and answers with the legacy envelope.
// A 2.0 error still has jsonrpc, so a bad method name does not flip the client.
export function shouldFallbackToLegacy(body: any): boolean {
  if (!isRecord(body) || body.jsonrpc) return false;
  return typeof body.result === "string" && body.result !== "success";
}

export function normalizeResponse(body: any, method: string): any {
  if (!isRecord(body) || body.jsonrpc !== "2.0") return body;
  if (body.error) {
    const data = isRecord(body.error.data) ? body.error.data : {};
    const detail = data.errorString || data.error_string;
    return {
      result: detail || body.error.message || "RPC error",
      arguments: isRecord(data.result) ? restoreArguments(method, data.result) : {},
      tag: body.id,
    };
  }
  return {
    result: "success",
    arguments: restoreArguments(method, body.result),
    tag: body.id,
  };
}
