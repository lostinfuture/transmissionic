<template>
  <div
    class="transfer-widget"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <div class="rates">
      <div class="rate download" :title="Locale.download">
        <div class="rate-main">
          <svg class="dir-icon" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M8 2.5v10m0 0l-4-4m4 4l4-4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="value tabular">{{ downloadRateParts.value }}</span>
          <span class="unit tabular">{{ downloadRateParts.unit }}</span>
        </div>
        <div v-if="downloadLimitFormatted" class="rate-sub tabular">
          <span class="limit">[{{ downloadLimitFormatted }}]</span>
        </div>
      </div>

      <div class="rate upload" :title="Locale.uploadSpeed">
        <div class="rate-main">
          <svg class="dir-icon" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M8 13.5v-10m0 0l-4 4m4-4l4 4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="value tabular">{{ uploadRateParts.value }}</span>
          <span class="unit tabular">{{ uploadRateParts.unit }}</span>
        </div>
        <div v-if="uploadLimitFormatted" class="rate-sub tabular">
          <span class="limit">[{{ uploadLimitFormatted }}]</span>
        </div>
      </div>
    </div>

    <div class="graph-wrap" ref="graphWrap">
      <div v-if="hoverIndex !== null && hoverTimeLabel" class="hover-time tabular">
        {{ hoverTimeLabel }}
      </div>
      <svg
        class="graph"
        :viewBox="`0 0 ${width} ${height}`"
        preserveAspectRatio="none"
        role="img"
        :aria-label="Locale.statistics"
      >
        <defs>
          <linearGradient id="transfer-dl-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--positive)" stop-opacity="0.28" />
            <stop offset="100%" stop-color="var(--positive)" stop-opacity="0.0" />
          </linearGradient>
          <linearGradient id="transfer-ul-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--info)" stop-opacity="0.28" />
            <stop offset="100%" stop-color="var(--info)" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <path class="area upload" :d="uploadAreaPath" fill="url(#transfer-ul-grad)" />
        <path class="line upload" :d="uploadLinePath" />

        <path class="area download" :d="downloadAreaPath" fill="url(#transfer-dl-grad)" />
        <path class="line download" :d="downloadLinePath" />

        <line
          v-if="hoverPoint"
          class="hover-guide"
          :x1="hoverPoint.x"
          :y1="topPad"
          :x2="hoverPoint.x"
          :y2="height - bottomPad"
        />
      </svg>

      <svg
        v-if="hoverPoint"
        class="graph-overlay"
        :viewBox="`0 0 ${width} ${height}`"
        aria-hidden="true"
      >
        <circle
          class="point upload"
          :cx="hoverPoint.x"
          :cy="hoverPoint.ulY"
          r="3.5"
        />
        <circle
          class="point download"
          :cx="hoverPoint.x"
          :cy="hoverPoint.dlY"
          r="3.5"
        />
      </svg>
    </div>

    <div class="stats-wrap">
      <table class="stats-table tabular" :aria-label="Locale.statistics">
        <thead>
          <tr>
            <th scope="col"><span class="visually-hidden">{{ Locale.name }}</span></th>
            <th scope="col">{{ Locale.current }}</th>
            <th scope="col">{{ Locale.total }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{{ Locale.downloaded }}</th>
            <td>{{ currentDownloadedFormatted }}</td>
            <td>{{ totalDownloadedFormatted }}</td>
          </tr>
          <tr>
            <th scope="row">{{ Locale.uploaded }}</th>
            <td>{{ currentUploadedFormatted }}</td>
            <td>{{ totalUploadedFormatted }}</td>
          </tr>
          <tr>
            <th scope="row">{{ Locale.duration }}</th>
            <td>{{ currentDurationFormatted }}</td>
            <td>{{ totalDurationFormatted }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="egress-wrap">
      <table class="stats-table egress-table tabular" :aria-label="Locale.egressIp || 'Egress IP'">
        <tbody>
          <tr>
            <th scope="row">{{ Locale.egressIp || "Egress IP" }}</th>
            <td class="selectable" translate="no" :class="{ muted: !egressIp }">{{ egressIp || "—" }}</td>
          </tr>
          <tr>
            <th scope="row">{{ Locale.location || "Location" }}</th>
            <td class="selectable location-cell" :class="{ muted: !egressLocation }" :title="egressTitle || undefined">{{ egressLocation || "—" }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Locale } from "../../services/Locale";
import { Utils } from "../../services/Utils";
import { TransmissionRPC } from "../../services/TransmissionRPC";
import { Emitter } from "../../services/Emitter";
import { UserSettings } from "../../services/UserSettings";
import {
  EgressInfo,
  fetchEgressInfo,
  formatEgressLocation,
  formatEgressTitle,
} from "../../services/EgressInfo";

interface Point {
  x: number;
  y: number;
}

function monotoneCubicLine(points: Point[]): string {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;

  const dx: number[] = [];
  const dy: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const deltaX = points[i + 1].x - points[i].x;
    const deltaY = points[i + 1].y - points[i].y;
    dx.push(deltaX);
    dy.push(deltaY);
    d.push(deltaX !== 0 ? deltaY / deltaX : 0);
  }

  const m: number[] = new Array(n).fill(0);
  m[0] = d[0];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) {
      m[i] = 0;
    } else {
      m[i] = (d[i - 1] + d[i]) / 2;
    }
  }
  m[n - 1] = d[n - 2];

  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const alpha = m[i] / d[i];
      const beta = m[i + 1] / d[i];
      const s = alpha * alpha + beta * beta;
      if (s > 9) {
        const tau = 3 / Math.sqrt(s);
        m[i] = tau * alpha * d[i];
        m[i + 1] = tau * beta * d[i];
      }
    }
  }

  let path = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const seg = dx[i] / 3;
    const cp1x = points[i].x + seg;
    const cp1y = points[i].y + m[i] * seg;
    const cp2x = points[i + 1].x - seg;
    const cp2y = points[i + 1].y - m[i + 1] * seg;
    path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${points[i + 1].x.toFixed(2)},${points[i + 1].y.toFixed(2)}`;
  }
  return path;
}

function splitRate(formatted: string | void): { value: string; unit: string } {
  const str = (formatted || "0 B/s").trim();
  const idx = str.lastIndexOf(" ");
  if (idx === -1) return { value: str, unit: "" };
  return {
    value: str.slice(0, idx),
    unit: str.slice(idx + 1),
  };
}

export default defineComponent({
  name: "TransferGraph",
  props: {
    torrentList: {
      type: Array,
      default: () => [],
    },
    connected: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      width: 304,
      height: 84,
      topPad: 14,
      bottomPad: 2,
      sampleCount: 30,
      history: [] as Array<Array<number | null>>,
      sessionStats: null as Record<string, any> | null,
      hoverIndex: null as number | null,
      sharedState: UserSettings.state,
      egress: null as EgressInfo | null,
      egressTimer: null as ReturnType<typeof setInterval> | null,
      lastEgressFetch: 0,
    };
  },
  setup() {
    return {
      Locale,
      Utils,
    };
  },
  watch: {
    connected(isConnected: boolean) {
      if (isConnected) {
        this.refreshEgress(true);
      }
    },
  },
  created() {
    this.syncFromRPC();
    Emitter.on("session-stats", this.onSessionStats);
    Emitter.on("refresh", this.onRefresh);
    this.refreshEgress(true);
    this.egressTimer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      this.refreshEgress(false);
    }, 60000);
  },
  beforeUnmount() {
    Emitter.off("session-stats", this.onSessionStats);
    Emitter.off("refresh", this.onRefresh);
    if (this.egressTimer !== null) {
      clearInterval(this.egressTimer);
      this.egressTimer = null;
    }
  },
  computed: {
    egressIp(): string {
      return this.egress?.ip || "";
    },
    egressLocation(): string {
      return formatEgressLocation(this.egress);
    },
    egressTitle(): string {
      return formatEgressTitle(this.egress);
    },
    normalizedSamples(): Array<{ dl: number; ul: number; ts: number }> {
      const now = Date.now();
      const raw = this.history.length > 0 ? this.history : TransmissionRPC.statsHistory || [];
      const count = this.sampleCount;
      const result: Array<{ dl: number; ul: number; ts: number }> = [];
      const padCount = Math.max(0, count - raw.length);
      for (let i = 0; i < padCount; i++) {
        result.push({
          dl: 0,
          ul: 0,
          ts: now - (count - 1 - i) * 5000,
        });
      }
      const tail = raw.slice(-count);
      for (let i = 0; i < tail.length; i++) {
        const entry = tail[i] || [0, 0];
        result.push({
          dl: Math.max(0, Number(entry[0]) || 0),
          ul: Math.max(0, Number(entry[1]) || 0),
          ts: Number(entry[2]) || now - (tail.length - 1 - i) * 5000,
        });
      }
      return result;
    },
    activeDownloadSpeed(): number {
      if (this.hoverIndex !== null && this.normalizedSamples[this.hoverIndex]) {
        return this.normalizedSamples[this.hoverIndex].dl;
      }
      if (this.sessionStats && typeof this.sessionStats.downloadSpeed === "number") {
        return this.sessionStats.downloadSpeed;
      }
      return (this.torrentList as Array<Record<string, any>>).reduce(
        (sum, t) => sum + (Number(t.rateDownload) || 0),
        0
      );
    },
    activeUploadSpeed(): number {
      if (this.hoverIndex !== null && this.normalizedSamples[this.hoverIndex]) {
        return this.normalizedSamples[this.hoverIndex].ul;
      }
      if (this.sessionStats && typeof this.sessionStats.uploadSpeed === "number") {
        return this.sessionStats.uploadSpeed;
      }
      return (this.torrentList as Array<Record<string, any>>).reduce(
        (sum, t) => sum + (Number(t.rateUpload) || 0),
        0
      );
    },
    downloadRateParts(): { value: string; unit: string } {
      void this.sharedState.useBits;
      return splitRate(Utils.formatBytes(this.activeDownloadSpeed, 1, true));
    },
    uploadRateParts(): { value: string; unit: string } {
      void this.sharedState.useBits;
      return splitRate(Utils.formatBytes(this.activeUploadSpeed, 1, true));
    },
    currentDownloadedFormatted(): string {
      const current = this.sessionStats?.["current-stats"]?.downloadedBytes;
      const bytes = typeof current === "number" ? current : 0;
      return (Utils.formatBytes(bytes, 1, false) as string) || "0 B";
    },
    totalDownloadedFormatted(): string {
      const current = this.sessionStats?.["current-stats"]?.downloadedBytes;
      const cumulative = this.sessionStats?.["cumulative-stats"]?.downloadedBytes;
      const bytes =
        typeof cumulative === "number" && cumulative > 0
          ? cumulative
          : typeof current === "number"
          ? current
          : 0;
      return (Utils.formatBytes(bytes, 1, false) as string) || "0 B";
    },
    currentUploadedFormatted(): string {
      const current = this.sessionStats?.["current-stats"]?.uploadedBytes;
      const bytes = typeof current === "number" ? current : 0;
      return (Utils.formatBytes(bytes, 1, false) as string) || "0 B";
    },
    totalUploadedFormatted(): string {
      const current = this.sessionStats?.["current-stats"]?.uploadedBytes;
      const cumulative = this.sessionStats?.["cumulative-stats"]?.uploadedBytes;
      const bytes =
        typeof cumulative === "number" && cumulative > 0
          ? cumulative
          : typeof current === "number"
          ? current
          : 0;
      return (Utils.formatBytes(bytes, 1, false) as string) || "0 B";
    },
    currentDurationFormatted(): string {
      void this.sharedState.language;
      const sec = this.sessionStats?.["current-stats"]?.secondsActive;
      if (typeof sec !== "number" || sec <= 0) return "—";
      return Utils.durationToString(sec * 1000) || "—";
    },
    totalDurationFormatted(): string {
      void this.sharedState.language;
      const sec = this.sessionStats?.["cumulative-stats"]?.secondsActive;
      if (typeof sec !== "number" || sec <= 0) return this.currentDurationFormatted;
      return Utils.durationToString(sec * 1000) || "—";
    },
    downloadLimitFormatted(): string {
      const args = TransmissionRPC.sessionArguments;
      if (!args) return "";
      if (args["alt-speed-enabled"] && args["alt-speed-down"] > 0) {
        return (Utils.formatBytes(args["alt-speed-down"] * 1000, 0, true) as string) || "";
      }
      if (args["speed-limit-down-enabled"] && args["speed-limit-down"] > 0) {
        return (Utils.formatBytes(args["speed-limit-down"] * 1000, 0, true) as string) || "";
      }
      return "";
    },
    uploadLimitFormatted(): string {
      const args = TransmissionRPC.sessionArguments;
      if (!args) return "";
      if (args["alt-speed-enabled"] && args["alt-speed-up"] > 0) {
        return (Utils.formatBytes(args["alt-speed-up"] * 1000, 0, true) as string) || "";
      }
      if (args["speed-limit-up-enabled"] && args["speed-limit-up"] > 0) {
        return (Utils.formatBytes(args["speed-limit-up"] * 1000, 0, true) as string) || "";
      }
      return "";
    },
    maxGraphRate(): number {
      let peak = 0;
      for (const s of this.normalizedSamples) {
        if (s.dl > peak) peak = s.dl;
        if (s.ul > peak) peak = s.ul;
      }
      return Math.max(1024, peak * 1.12);
    },
    downloadPoints(): Point[] {
      const samples = this.normalizedSamples;
      const n = samples.length;
      const usableH = this.height - this.topPad - this.bottomPad;
      const base = this.height - this.bottomPad;
      const max = this.maxGraphRate;
      return samples.map((s, i) => ({
        x: (i / Math.max(1, n - 1)) * this.width,
        y: base - (Math.min(s.dl, max) / max) * usableH,
      }));
    },
    uploadPoints(): Point[] {
      const samples = this.normalizedSamples;
      const n = samples.length;
      const usableH = this.height - this.topPad - this.bottomPad;
      const base = this.height - this.bottomPad;
      const max = this.maxGraphRate;
      return samples.map((s, i) => ({
        x: (i / Math.max(1, n - 1)) * this.width,
        y: base - (Math.min(s.ul, max) / max) * usableH,
      }));
    },
    downloadLinePath(): string {
      return monotoneCubicLine(this.downloadPoints);
    },
    downloadAreaPath(): string {
      const line = this.downloadLinePath;
      if (!line) return "";
      return `${line} L ${this.width},${this.height} L 0,${this.height} Z`;
    },
    uploadLinePath(): string {
      return monotoneCubicLine(this.uploadPoints);
    },
    uploadAreaPath(): string {
      const line = this.uploadLinePath;
      if (!line) return "";
      return `${line} L ${this.width},${this.height} L 0,${this.height} Z`;
    },
    hoverPoint(): { x: number; dlY: number; ulY: number } | null {
      if (this.hoverIndex === null) return null;
      const dl = this.downloadPoints[this.hoverIndex];
      const ul = this.uploadPoints[this.hoverIndex];
      if (!dl || !ul) return null;
      return {
        x: dl.x,
        dlY: dl.y,
        ulY: ul.y,
      };
    },
    hoverTimeLabel(): string {
      if (this.hoverIndex === null) return "";
      const sample = this.normalizedSamples[this.hoverIndex];
      if (!sample || !sample.ts) return "";
      return new Date(sample.ts).toLocaleTimeString(UserSettings.getLanguage(), {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    },
  },
  methods: {
    syncFromRPC() {
      this.sessionStats = TransmissionRPC.sessionStats ? { ...TransmissionRPC.sessionStats } : null;
      this.history = Array.isArray(TransmissionRPC.statsHistory)
        ? TransmissionRPC.statsHistory.map((row) => [...row])
        : [];
    },
    onSessionStats(payload: any = null) {
      if (payload && payload.sessionStats) {
        this.sessionStats = { ...payload.sessionStats };
      } else if (TransmissionRPC.sessionStats) {
        this.sessionStats = { ...TransmissionRPC.sessionStats };
      }
      const hist = (payload && payload.statsHistory) || TransmissionRPC.statsHistory || [];
      this.history = hist.map((row: Array<number | null>) => [...row]);
    },
    onMouseMove(e: MouseEvent) {
      const wrap = this.$refs.graphWrap as HTMLElement | undefined;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      if (rect.width <= 0) return;
      const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const count = this.normalizedSamples.length;
      this.hoverIndex = Math.round(relX * (count - 1));
    },
    onMouseLeave() {
      this.hoverIndex = null;
    },
    onRefresh() {
      this.refreshEgress(false);
    },
    async refreshEgress(force = false) {
      const now = Date.now();
      if (!force && now - this.lastEgressFetch < 10000) {
        return;
      }
      this.lastEgressFetch = now;
      const info = await fetchEgressInfo();
      this.egress = info;
    },
  },
});
</script>

<style scoped>
.transfer-widget {
  margin: 0 -8px;
  padding: 14px 0 0;
  border-bottom: 1px solid var(--line);
  background: var(--ground);
  user-select: none;
}

.rates {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
  padding: 0 14px 4px;
}

.rate {
  min-width: 0;
}

.rate-main {
  display: flex;
  align-items: baseline;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
}

.dir-icon {
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  transform: translateY(1px);
}

.rate.download .dir-icon,
.rate.download .value,
.rate.download .unit {
  color: var(--positive);
}

.rate.upload .dir-icon,
.rate.upload .value,
.rate.upload .unit {
  color: var(--info);
}

.value {
  font-size: 21px;
  line-height: 1.15;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.unit {
  font-size: 13px;
  line-height: 1.15;
  font-weight: 500;
  opacity: 0.68;
}

.rate-sub {
  display: flex;
  align-items: center;
  gap: 5px;
  padding-inline-start: 18px;
  margin-top: 2px;
  font-size: var(--fs-small);
  line-height: 1.25;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.limit {
  color: var(--faint);
}

.graph-wrap {
  position: relative;
  width: 100%;
  height: 84px;
}

.hover-time {
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  line-height: 1;
  font-weight: 500;
  color: var(--muted);
  background: var(--ground);
  padding: 1px 6px;
  border-radius: 4px;
  pointer-events: none;
  z-index: 2;
}

.graph,
.graph-overlay {
  display: block;
  width: 100%;
  height: 84px;
}

.graph-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.line {
  fill: none;
  stroke-width: 1.75px;
  stroke-opacity: 0.85;
  vector-effect: non-scaling-stroke;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.line.download {
  stroke: var(--positive);
}

.line.upload {
  stroke: var(--info);
}

.hover-guide {
  stroke: var(--control);
  stroke-width: 1px;
  stroke-dasharray: 2 2;
  vector-effect: non-scaling-stroke;
}

.point.download {
  fill: var(--positive);
  stroke: var(--ground);
  stroke-width: 1.5px;
}

.point.upload {
  fill: var(--info);
  stroke: var(--ground);
  stroke-width: 1.5px;
}

.stats-wrap {
  padding: 6px 14px 10px;
  border-top: 1px solid var(--rule);
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-small);
  line-height: 1.3;
}

.stats-table th,
.stats-table td {
  padding: 3px 0 3px 8px;
  text-align: end;
}

.stats-table thead th {
  font-size: 11px;
  font-weight: 600;
  color: var(--faint);
  padding-bottom: 4px;
}

.stats-table tbody th {
  text-align: start;
  font-weight: 500;
  color: var(--muted);
  padding-inline-start: 0;
}

.stats-table tbody td {
  color: var(--ink);
  font-weight: 500;
  white-space: nowrap;
}

.egress-wrap {
  padding: 6px 14px 10px;
  border-top: 1px solid var(--rule);
}

.egress-table {
  table-layout: fixed;
}

.egress-table tbody th {
  width: 36%;
  white-space: nowrap;
}

.egress-table tbody td {
  width: 64%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.egress-table tbody td.muted {
  color: var(--muted);
  font-weight: 400;
}
</style>
