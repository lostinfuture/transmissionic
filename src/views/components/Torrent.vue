<template>
  <div :class="['torrent', 'tone-' + state.tone, { condensed }]" tabindex="0" :aria-label="torrent.name">
    <div v-if="orderByPosition" class="lead order">
      <button type="button" class="step" :aria-label="Locale.queuePosition + ' +'" @click="changeTorrentPosition($event,true)">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 10l4-4 4 4" /></svg>
      </button>
      <button type="button" class="step" :aria-label="Locale.queuePosition + ' −'" @click="changeTorrentPosition($event,false)">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg>
      </button>
    </div>
    <div v-else class="lead">
      <button
        type="button"
        class="toggle"
        :aria-label="paused ? Locale.actions.start : Locale.actions.stop"
        :title="paused ? Locale.actions.start : Locale.actions.stop"
        @click="switchTorrentState($event)">
        <svg v-if="paused" viewBox="0 0 16 16" aria-hidden="true"><path class="fill" d="M5.5 3.8v8.4a.5.5 0 0 0 .77.42l6.4-4.2a.5.5 0 0 0 0-.84l-6.4-4.2a.5.5 0 0 0-.77.42z" /></svg>
        <svg v-else viewBox="0 0 16 16" aria-hidden="true"><rect class="fill" x="4.5" y="3.5" width="2.6" height="9" rx=".6" /><rect class="fill" x="8.9" y="3.5" width="2.6" height="9" rx=".6" /></svg>
      </button>
    </div>

    <div class="main">
      <div class="name" :title="torrent.name">{{ torrent.name }}</div>

      <div class="rail" aria-hidden="true">
        <div class="fill" :style="{ transform: 'scaleX(' + railValue + ')' }"></div>
      </div>

      <div class="meta">
        <span class="state">
          <span class="dot" aria-hidden="true"></span>{{ state.label }}
        </span>
        <span class="pct tabular" v-if="!state.error">{{ state.percent }}</span>
        <span class="note" :title="state.note" v-if="state.note">{{ state.note }}</span>

        <!-- Narrow screens: transfer rates when moving, otherwise the size -->
        <span class="aside tabular" v-if="moving">
          <span v-if="torrent.rateDownload>1" class="rate down">↓&nbsp;{{ Utils.formatBytes(torrent.rateDownload,1,true) }}</span>
          <span v-if="torrent.rateUpload>1" class="rate up">↑&nbsp;{{ Utils.formatBytes(torrent.rateUpload,1,true) }}</span>
        </span>
        <span class="aside tabular" v-else>{{ sizeText }}</span>
      </div>
    </div>

    <!-- Wide screens: one column per figure, aligned with the list header -->
    <span class="col size tabular">{{ sizeText }}</span>
    <span class="col down tabular" :class="{ idle: !(torrent.rateDownload>1) }">{{ Utils.formatBytes(torrent.rateDownload>1 ? torrent.rateDownload : 0,1,true) }}</span>
    <span class="col up tabular" :class="{ idle: !(torrent.rateUpload>1) }">{{ Utils.formatBytes(torrent.rateUpload>1 ? torrent.rateUpload : 0,1,true) }}</span>
    <span class="col ratio tabular">{{ Utils.getRatio(torrent.uploadRatio, 2) }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Locale } from "../../services/Locale";
import { Utils } from "../../services/Utils";
import { Emitter } from "../../services/Emitter";
import { UserSettings } from '../../services/UserSettings';

export default defineComponent({
  props: ['torrent'],
  setup() {
    return { 
      Locale,
      Utils
    }
  },
  computed: {
    orderByPosition(): boolean {
      return UserSettings.state.orderBy=="queuePosition";
    },
    condensed(): boolean {
      return UserSettings.state.compactMode
    },
    paused(): boolean {
      return this.torrent.status==0;
    },
    moving(): boolean {
      return this.torrent.rateDownload>1 || this.torrent.rateUpload>1;
    },
    railValue(): number {
      const value = this.torrent.status==2 ? this.torrent.recheckProgress : this.torrent.percentDone;
      return Math.min(Math.max(value || 0, 0), 1);
    },
    sizeText(): string {
      const total = Utils.formatBytes(this.torrent.sizeWhenDone,1) || "";
      if(this.torrent.percentDone>=1 || this.torrent.percentDone<=0){
        return total;
      }
      const done = Utils.formatBytes(this.torrent.sizeWhenDone*this.torrent.percentDone,1) || "";
      return `${done} ${Locale.of} ${total}`;
    },
    state(): Record<string, any> {
      const t = this.torrent;
      const percent = Utils.getPercent(t.percentDone);
      if(t.errorString && t.errorString!=''){
        return { tone:"negative", label:Locale.error.error, percent, note:Utils.localizeError(t.errorString), error:true };
      }
      switch (t.status) {
        case 4:
          return { tone:"positive", label:Locale.filters.downloading, percent, note: t.eta>=0 ? Utils.durationToString(t.eta*1000) : "" };
        case 6:
          return { tone:"info", label:Locale.filters.seeding, percent:"", note:"" };
        case 1:
        case 2:
          return { tone:"warning", label:Locale.filters.verifying, percent:Utils.getPercent(t.recheckProgress), note:"" };
        case 3:
          return { tone:"neutral", label:Locale.filters.queued, percent: t.percentDone<1 ? percent : "", note:"" };
        case 5:
          return { tone:"info", label:Locale.filters.queued, percent: t.percentDone<1 ? percent : "", note:"" };
        default:
          return { tone:"neutral", label: t.percentDone>=1 ? Locale.filters.completed : Locale.filters.stopped, percent: t.percentDone<1 ? percent : "", note:"" };
      }
    }
  },
  methods: {
    switchTorrentState(e: Event){
      e.stopPropagation();
      Emitter.emit('switch', this.torrent.id)
    },
    changeTorrentPosition(e: Event, up: boolean) {
      e.stopPropagation();
      Emitter.emit("torrent-position",{
        id:this.torrent.id,
        up: up
      })
    }
  }
})
</script>

<style scoped>
/*
  One row per torrent. Height is fixed (the list is virtual-scrolled):
  68px normal, 44px condensed. Keep in sync with itemSize in List.vue.
*/
.torrent {
  --tone: var(--neutral);
  box-sizing: border-box;
  height: 68px;
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  column-gap: 14px;
  align-items: center;
  padding: 0 max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left));
  border-bottom: 1px solid var(--rule);
  text-align: left;
  color: var(--ink);
  cursor: default;
  transition: background-color var(--t-hover) var(--ease-out);
}

.tone-positive { --tone: var(--positive); }
.tone-info     { --tone: var(--info); }
.tone-warning  { --tone: var(--warning); }
.tone-negative { --tone: var(--negative); }

@media (hover: hover) {
  .torrent:hover {
    background: var(--raised);
  }
}

.torrent:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: -2px;
}

.torrent.selected {
  background: var(--active);
  box-shadow: inset 3px 0 0 var(--ink);
}

/* Lead: play / pause or queue position */
.lead {
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle {
  width: 32px;
  height: 32px;
  padding: 0;
  display: grid;
  place-items: center;
  border: 1px solid var(--control);
  border-radius: 50%;
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  transition: background-color var(--t-hover) var(--ease-out), border-color var(--t-hover) var(--ease-out);
}

.toggle:hover {
  border-color: var(--ink);
}

.toggle svg {
  width: 14px;
  height: 14px;
}

.toggle .fill {
  fill: currentColor;
}

.order {
  flex-direction: column;
  gap: 2px;
}

.step {
  width: 28px;
  height: 22px;
  padding: 0;
  display: grid;
  place-items: center;
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.step:hover {
  border-color: var(--control);
  color: var(--ink);
}

.step svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Main column: name, progress rail, status line */
.main {
  min-width: 0;
  display: grid;
  grid-template-rows: auto 4px auto;
  row-gap: 6px;
}

.name {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.rail {
  height: 4px;
  border-radius: 2px;
  background: var(--rail);
  overflow: hidden;
}

.rail .fill {
  height: 100%;
  background: var(--tone);
  transform-origin: left center;
  transition: transform .3s var(--ease-out);
}

[dir="rtl"] .rail .fill {
  transform-origin: right center;
}

.meta {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
  font-size: var(--fs-small);
  line-height: 16px;
  color: var(--muted);
  white-space: nowrap;
}

.state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ink);
  font-weight: 500;
  flex: 0 0 auto;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tone);
}

.tone-negative .state {
  color: var(--negative);
}

.pct {
  flex: 0 0 auto;
}

.note {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tone-negative .note {
  color: var(--negative);
}

.aside {
  margin-inline-start: auto;
  flex: 0 0 auto;
  display: inline-flex;
  gap: 10px;
}

.rate.down { color: var(--positive); }
.rate.up   { color: var(--info); }

/* Wide-screen columns are hidden on narrow screens */
.col {
  display: none;
}

/* Condensed: one line, rail becomes a hairline under the name */
.torrent.condensed {
  height: 44px;
  column-gap: 12px;
}

.torrent.condensed .toggle {
  width: 26px;
  height: 26px;
}

.torrent.condensed .toggle svg {
  width: 12px;
  height: 12px;
}

.torrent.condensed .order {
  flex-direction: row;
}

.torrent.condensed .step {
  width: 16px;
}

.torrent.condensed .main {
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: 20px 2px;
  row-gap: 4px;
  column-gap: 12px;
}

.torrent.condensed .name {
  grid-column: 1;
  grid-row: 1;
}

.torrent.condensed .meta {
  grid-column: 2;
  grid-row: 1;
}

.torrent.condensed .rail {
  grid-column: 1 / -1;
  grid-row: 2;
  height: 2px;
}

.torrent.condensed .note,
.torrent.condensed .aside {
  display: none;
}

@media (max-width: 899px) {
  .torrent.condensed.tone-negative .pct {
    display: none;
  }
}

/* Wide screens: figures move into aligned columns */
@media (min-width: 900px) {
  .torrent {
    grid-template-columns: 32px minmax(0, 1fr) 128px 96px 96px 56px;
  }

  .col {
    display: block;
    font-size: 13px;
    text-align: end;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .col.size  { color: var(--muted); }
  .col.down  { color: var(--positive); }
  .col.up    { color: var(--info); }
  .col.ratio { color: var(--ink); }
  .col.idle  { color: var(--faint); }

  .aside {
    display: none;
  }

  .torrent.condensed .meta {
    min-width: 150px;
  }
}
</style>
