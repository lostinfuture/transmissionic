<template>
  <ion-content ref="content" v-if="details">
    <div class="infos">

      <!-- Lead: where the transfer stands -->
      <section class="lead" :class="'tone-' + tone" :aria-label="Locale.status">
        <div class="lead-row">
          <span class="lead-value tabular">{{ Utils.getPercent(details.percentDone) }}</span>
          <span class="state"><span class="dot" aria-hidden="true"></span>{{ statusLabel }}</span>
          <span class="state" v-if="details.status==4 && details.eta>=0">{{ Utils.durationToString(details.eta*1000) }}</span>
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

      <section class="block">
        <h2>{{ Locale.transfer }}</h2>
        <dl>
          <div><dt>{{ Locale.downloaded }}</dt><dd class="tabular selectable">{{ Utils.formatBytes(details.downloadedEver) }}</dd></div>
          <div><dt>{{ Locale.uploaded }}</dt><dd class="tabular selectable">{{ Utils.formatBytes(details.uploadedEver) }}</dd></div>
          <div><dt>{{ Locale.shareRatio }}</dt><dd class="tabular selectable">{{ Utils.getRatio(details.uploadRatio, 10) }}</dd></div>
          <div><dt>{{ Locale.tracker.one }}</dt><dd class="selectable" translate="no">{{ (details.trackers && details.trackers.length>0) ? Utils.trackerDomain(details.trackers[0].announce).domain : "—" }}</dd></div>
          <div><dt>{{ Locale.lastActivity }}</dt><dd class="selectable">{{ Utils.secondsToDate(details.activityDate, true) }}</dd></div>
          <div><dt>{{ Locale.downloadTime }}</dt><dd class="selectable">{{ Utils.durationToString(details.secondsDownloading*1000) }}</dd></div>
          <div><dt>{{ Locale.seedTime }}</dt><dd class="selectable">{{ Utils.durationToString(details.secondsSeeding*1000) }}</dd></div>
        </dl>
      </section>

      <section class="block">
        <h2>{{ Locale.information }}</h2>
        <dl>
          <div class="wide"><dt>{{ Locale.name }}</dt><dd class="selectable">{{ details.name }}</dd></div>
          <div class="wide"><dt>{{ Locale.downloadDir }}</dt><dd class="selectable" translate="no">{{ details.downloadDir }}</dd></div>
          <div>
            <dt>{{ Locale.totalSize }}</dt>
            <dd class="tabular selectable">
              {{ Utils.formatBytes(details.totalSize) }}
              <template v-if="details.totalSize != details.sizeWhenDone">
                <span class="muted">({{ Utils.formatBytes(details.sizeWhenDone) }} {{ Locale.selected.one }})</span>
              </template>
            </dd>
          </div>
          <div><dt>{{ Locale.files }}</dt><dd class="tabular selectable">{{ details.files ? details.files.length : "—" }}</dd></div>
          <div><dt>{{ Locale.pieces }}</dt><dd class="tabular selectable">{{ details.pieceCount }} × {{ Utils.formatBytes(details.pieceSize) }}</dd></div>
          <div><dt>{{ Locale.createdBy }}</dt><dd class="selectable">{{ details.creator || "—" }}</dd></div>
          <div><dt>{{ Locale.createdOn }}</dt><dd class="selectable">{{ Utils.secondsToDate(details.dateCreated, true) }}</dd></div>
          <div><dt>{{ Locale.addedOn }}</dt><dd class="selectable">{{ Utils.secondsToDate(details.addedDate, true) }}</dd></div>
          <div><dt>{{ Locale.completedOn }}</dt><dd class="selectable">{{ Utils.secondsToDate(details.doneDate, true) }}</dd></div>
          <div class="wide" v-if="details.comment"><dt>{{ Locale.comment }}</dt><dd class="selectable" v-html="Utils.autoLink(details.comment)"></dd></div>
          <div class="wide"><dt>{{ Locale.hash }}</dt><dd class="selectable code" translate="no">{{ details.hashString }}</dd></div>
          <div class="wide"><dt>{{ Locale.magnet }}</dt><dd class="code" translate="no"><a :href="details.magnetLink">{{ details.magnetLink }}</a></dd></div>
        </dl>
      </section>

    </div>
  </ion-content>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue';
import { 
  IonContent,
} from '@ionic/vue';
import { Locale } from "../../services/Locale";
import { Utils } from "../../services/Utils";

export default defineComponent({
  components: {
    IonContent,
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
.infos {
  box-sizing: border-box;
  max-width: 960px;
  padding: 20px max(16px, env(safe-area-inset-right)) 32px max(16px, env(safe-area-inset-left));
  display: grid;
  gap: 28px;
}

/* Lead */
.lead {
  --tone: var(--neutral);
  display: grid;
  gap: 10px;
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
}

.state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-body);
  font-weight: 500;
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

/* Label / value blocks */
.block h2 {
  margin: 0 0 8px;
  font-size: var(--fs-section);
  font-weight: 600;
}

dl {
  margin: 0;
  display: grid;
  grid-template-columns: 1fr;
}

dl > div {
  display: grid;
  grid-template-columns: minmax(120px, 34%) minmax(0, 1fr);
  gap: 16px;
  padding: 9px 0;
  border-bottom: 1px solid var(--rule);
  min-width: 0;
}

dt {
  font-size: var(--fs-body);
  font-weight: 500;
  line-height: 20px;
  color: var(--muted);
}

dd {
  margin: 0;
  font-size: var(--fs-body);
  line-height: 20px;
  color: var(--ink);
  overflow-wrap: anywhere;
  min-width: 0;
}

dd .muted {
  color: var(--muted);
}

dd.code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
}

dd.code a {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (min-width: 900px) {
  dl {
    grid-template-columns: 1fr 1fr;
    column-gap: 32px;
  }

  dl > div.wide {
    grid-column: 1 / -1;
    grid-template-columns: minmax(120px, calc(17% - 8px)) minmax(0, 1fr);
  }
}
</style>
