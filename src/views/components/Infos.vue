<template>
  <ion-content class="ion-padding" ref="content" v-if="details">
    <!-- Lead: where the transfer stands -->
    <section class="lead-card" :class="'tone-' + tone" :aria-label="Locale.status">
      <div class="lead-row">
        <span class="lead-value tabular">{{ Utils.getPercent(details.percentDone) }}</span>
        <span class="state"><span class="dot" aria-hidden="true"></span>{{ statusLabel }}</span>
        <span class="eta tabular" v-if="details.status==4 && details.eta>=0">{{ Utils.durationToString(details.eta*1000) }}</span>
        <span class="rates tabular">
          <span class="down" v-if="details.rateDownload>1">↓&nbsp;{{ Utils.formatBytes(details.rateDownload,1,true) }}</span>
          <span class="up" v-if="details.rateUpload>1">↑&nbsp;{{ Utils.formatBytes(details.rateUpload,1,true) }}</span>
        </span>
      </div>
      <div class="rail" aria-hidden="true">
        <div class="fill" :style="{ transform: 'scaleX(' + (details.percentDone || 0) + ')' }"></div>
      </div>
      <p class="error" v-if="details.errorString" role="alert">{{ Utils.localizeError(details.errorString) }}</p>
    </section>

    <ion-list>
      <ion-list-header>
        <ion-label>{{ Locale.transfer }}</ion-label>
      </ion-list-header>
      <ion-item>
        <ion-label>{{ Locale.downloaded }}</ion-label>
        <span slot="end" class="info-value tabular selectable">{{ Utils.formatBytes(details.downloadedEver) }}</span>
      </ion-item>
      <ion-item>
        <ion-label>{{ Locale.uploaded }}</ion-label>
        <span slot="end" class="info-value tabular selectable">{{ Utils.formatBytes(details.uploadedEver) }}</span>
      </ion-item>
      <ion-item>
        <ion-label>{{ Locale.shareRatio }}</ion-label>
        <span slot="end" class="info-value tabular selectable">{{ Utils.getRatio(details.uploadRatio, 10) }}</span>
      </ion-item>
      <ion-item>
        <ion-label>{{ Locale.tracker.one }}</ion-label>
        <span slot="end" class="info-value selectable" translate="no">{{ (details.trackers && details.trackers.length>0) ? Utils.trackerDomain(details.trackers[0].announce).domain : "—" }}</span>
      </ion-item>
      <ion-item>
        <ion-label>{{ Locale.lastActivity }}</ion-label>
        <span slot="end" class="info-value tabular selectable">{{ Utils.secondsToDate(details.activityDate, true) }}</span>
      </ion-item>
      <ion-item>
        <ion-label>{{ Locale.downloadTime }}</ion-label>
        <span slot="end" class="info-value tabular selectable">{{ Utils.durationToString(details.secondsDownloading*1000) }}</span>
      </ion-item>
      <ion-item>
        <ion-label>{{ Locale.seedTime }}</ion-label>
        <span slot="end" class="info-value tabular selectable">{{ Utils.durationToString(details.secondsSeeding*1000) }}</span>
      </ion-item>
    </ion-list>

    <ion-list>
      <ion-list-header>
        <ion-label>{{ Locale.information }}</ion-label>
      </ion-list-header>
      <ion-item>
        <div class="stacked-field">
          <span class="field-label">{{ Locale.name }}</span>
          <span class="info-block selectable">{{ details.name }}</span>
        </div>
      </ion-item>
      <ion-item>
        <div class="stacked-field">
          <span class="field-label">{{ Locale.downloadDir }}</span>
          <span class="info-block selectable" translate="no">{{ details.downloadDir }}</span>
        </div>
      </ion-item>
      <ion-item>
        <ion-label>{{ Locale.totalSize }}</ion-label>
        <span slot="end" class="info-value tabular selectable">
          {{ Utils.formatBytes(details.totalSize) }}
          <template v-if="details.totalSize != details.sizeWhenDone">
            <span class="muted">({{ Utils.formatBytes(details.sizeWhenDone) }} {{ Locale.selected.one }})</span>
          </template>
        </span>
      </ion-item>
      <ion-item>
        <ion-label>{{ Locale.files }}</ion-label>
        <span slot="end" class="info-value tabular selectable">{{ details.files ? details.files.length : "—" }}</span>
      </ion-item>
      <ion-item>
        <ion-label>{{ Locale.pieces }}</ion-label>
        <span slot="end" class="info-value tabular selectable">{{ details.pieceCount }} × {{ Utils.formatBytes(details.pieceSize) }}</span>
      </ion-item>
      <ion-item>
        <ion-label>{{ Locale.createdBy }}</ion-label>
        <span slot="end" class="info-value selectable">{{ details.creator || "—" }}</span>
      </ion-item>
      <ion-item>
        <ion-label>{{ Locale.createdOn }}</ion-label>
        <span slot="end" class="info-value tabular selectable">{{ Utils.secondsToDate(details.dateCreated, true) }}</span>
      </ion-item>
      <ion-item>
        <ion-label>{{ Locale.addedOn }}</ion-label>
        <span slot="end" class="info-value tabular selectable">{{ Utils.secondsToDate(details.addedDate, true) }}</span>
      </ion-item>
      <ion-item>
        <ion-label>{{ Locale.completedOn }}</ion-label>
        <span slot="end" class="info-value tabular selectable">{{ Utils.secondsToDate(details.doneDate, true) }}</span>
      </ion-item>
      <ion-item v-if="details.comment">
        <div class="stacked-field">
          <span class="field-label">{{ Locale.comment }}</span>
          <span class="info-block selectable" v-html="Utils.autoLink(details.comment)"></span>
        </div>
      </ion-item>
      <ion-item>
        <div class="stacked-field">
          <span class="field-label">{{ Locale.hash }}</span>
          <span class="info-block code selectable" translate="no">{{ details.hashString }}</span>
        </div>
      </ion-item>
      <ion-item>
        <div class="stacked-field">
          <span class="field-label">{{ Locale.magnet }}</span>
          <span class="info-block code" translate="no"><a :href="details.magnetLink">{{ details.magnetLink }}</a></span>
        </div>
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue';
import { 
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
} from '@ionic/vue';
import { Locale } from "../../services/Locale";
import { Utils } from "../../services/Utils";

export default defineComponent({
  components: {
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
  },
  data() {
    return {
      details:{} as Record<string,any>,
      statusText:[
        Locale.filters.stopped,
        Locale.filters.verifying, // Waiting for verification
        Locale.filters.verifying,
        Locale.filters.queued,
        Locale.filters.downloading,
        Locale.filters.queued,
        Locale.filters.seeding
      ]
    }
  },
  setup() {
    return { 
      Utils,
      Locale
    }
  },
  computed: {
    tone(): string {
      if(this.details.errorString) return "negative";
      switch (this.details.status) {
        case 4: return "positive";
        case 6: return "info";
        case 1:
        case 2: return "warning";
        default: return "neutral";
      }
    },
    statusLabel(): string {
      let label = this.statusText[this.details.status] || "";
      if(this.details.status==0 && this.details.percentDone>=1){
        label = Locale.filters.completed;
      }
      if(this.details.status==2){
        label += ` ${Utils.getPercent(this.details.recheckProgress)}`;
      }
      return label;
    }
  },
  created() {
    this.details = inject('details') as Record<string,any>;
  },
  mounted() {
    Utils.customScrollbar(this.$refs.content)
  }
})
</script>

<style scoped>
/* Lead status card */
.lead-card {
  --tone: var(--neutral);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  padding: 16px;
  margin: 0 0 16px;
  display: grid;
  gap: 12px;
}

.tone-positive { --tone: var(--positive); }
.tone-info     { --tone: var(--info); }
.tone-warning  { --tone: var(--warning); }
.tone-negative { --tone: var(--negative); }

.lead-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.lead-value {
  font-size: var(--fs-lead);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-body);
  font-weight: 500;
  color: var(--ink);
}

.eta {
  font-size: var(--fs-body);
  color: var(--muted);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tone);
}

.rates {
  margin-inline-start: auto;
  display: inline-flex;
  gap: 14px;
  font-size: var(--fs-body);
  font-weight: 500;
}

.rates .down { color: var(--positive); }
.rates .up   { color: var(--info); }

.rail {
  height: 6px;
  border-radius: 3px;
  background: var(--rail);
  overflow: hidden;
}

.rail .fill {
  height: 100%;
  background: var(--tone);
  transform-origin: left center;
  transition: transform .3s var(--ease-out);
}

.error {
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--radius-control);
  background: var(--pill-negative-bg);
  color: var(--negative);
  font-size: var(--fs-body);
  overflow-wrap: anywhere;
}

.info-value {
  font-size: var(--fs-body);
  color: var(--ink);
}

.info-value .muted {
  color: var(--muted);
}

.info-block {
  font-size: var(--fs-body);
  color: var(--ink);
  overflow-wrap: anywhere;
}

.info-block.code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  color: var(--muted);
}

.info-block.code a {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
