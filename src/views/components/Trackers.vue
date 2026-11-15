<template>
  <ion-content class="ion-padding" ref="content">
    <template v-for="tracker in displayedTrackerList" :key="tracker.id">
      <ion-list class="tracker-card" :class="{ removed: removed.includes(tracker.announce) }">
        <ion-item class="tracker-header-item">
          <ion-label class="tracker-title">
            <span class="domain" translate="no">{{ Utils.trackerDomain(tracker.host).domain }}</span>
            <ion-badge>{{ Locale.tier }} {{ tracker.tier+1 }}</ion-badge>
            <ion-badge translate="no">{{ Utils.trackerDomain(tracker.host).protocol }}</ion-badge>
          </ion-label>
          <ion-button slot="end" fill="clear" class="tracker-menu-btn" @click="trackerActions(tracker)" :aria-label="Locale.actions.editAddress">
            <ion-icon slot="icon-only" :ios="ellipsisVerticalOutline" :md="ellipsisVerticalSharp"></ion-icon>
          </ion-button>
        </ion-item>

        <ion-item>
          <div class="stacked-field">
            <span class="field-label">{{ Locale.address }}</span>
            <span class="info-block code selectable" translate="no">{{ tracker.announce }}</span>
          </div>
        </ion-item>

        <template v-if="tracker.announceState!==0">
          <ion-item>
            <ion-label>{{ Locale.announce }}</ion-label>
            <span slot="end" class="info-value state-badge">
              <template v-if="tracker.announceState==3">
                <span class="dot warning" aria-hidden="true"></span>
                <span>{{ Locale.updating }}</span>
              </template>
              <template v-else-if="tracker.lastAnnounceSucceeded">
                <span class="dot positive" aria-hidden="true"></span>
                <span>{{ Locale.working }}</span>
              </template>
              <template v-else>
                <span class="dot negative" aria-hidden="true"></span>
                <span class="error selectable">{{ Utils.localizeError(tracker.lastAnnounceResult) }}</span>
              </template>
              <span v-if="tracker.lastAnnounceSucceeded || (tracker.lastAnnounceResult && tracker.lastAnnounceResult.length>0)" class="muted tabular">
                ({{ Utils.timeSince(tracker.lastAnnounceTime) }})
              </span>
            </span>
          </ion-item>
          <ion-item>
            <ion-label>{{ Locale.peerCount }}</ion-label>
            <span slot="end" class="info-value tabular selectable">{{ tracker.lastAnnouncePeerCount>=0 ? tracker.lastAnnouncePeerCount : "—" }}</span>
          </ion-item>
          <ion-item>
            <ion-label>{{ Locale.lastUpdate }}</ion-label>
            <span slot="end" class="info-value tabular selectable">{{ Utils.secondsToDate(tracker.lastAnnounceTime, false, true) }}</span>
          </ion-item>
          <ion-item>
            <ion-label>{{ Locale.nextUpdate }}</ion-label>
            <span slot="end" class="info-value tabular selectable">{{ Utils.secondsToDate(tracker.nextAnnounceTime, false, true) }}</span>
          </ion-item>
        </template>

        <template v-if="tracker.scrapeState!==0 && tracker.scrapeState!=2">
          <ion-item>
            <ion-label>{{ Locale.scrape }}</ion-label>
            <span slot="end" class="info-value state-badge">
              <template v-if="tracker.scrapeState==3">
                <span class="dot warning" aria-hidden="true"></span>
                <span>{{ Locale.updating }}</span>
              </template>
              <template v-else-if="tracker.lastScrapeSucceeded">
                <span class="dot positive" aria-hidden="true"></span>
                <span>{{ Locale.working }}</span>
              </template>
              <template v-else-if="tracker.lastScrapeResult && tracker.lastScrapeResult.length>0">
                <span class="dot negative" aria-hidden="true"></span>
                <span class="error selectable">{{ Utils.localizeError(tracker.lastScrapeResult) }}</span>
              </template>
              <template v-else>
                <span class="dot neutral" aria-hidden="true"></span>
                <span>{{ Locale.filters.waiting }}</span>
              </template>
              <span v-if="tracker.lastScrapeSucceeded || (tracker.lastScrapeResult && tracker.lastScrapeResult.length>0)" class="muted tabular">
                ({{ Utils.timeSince(tracker.lastScrapeTime) }})
              </span>
            </span>
          </ion-item>
          <ion-item v-if="tracker.seederCount>=0">
            <ion-label>{{ Locale.seeders }}</ion-label>
            <span slot="end" class="info-value tabular selectable">{{ tracker.seederCount }}</span>
          </ion-item>
          <ion-item v-if="tracker.leecherCount>=0">
            <ion-label>{{ Locale.leechers }}</ion-label>
            <span slot="end" class="info-value tabular selectable">{{ tracker.leecherCount }}</span>
          </ion-item>
          <ion-item v-if="tracker.downloadCount>=0">
            <ion-label>{{ Locale.downloadCount }}</ion-label>
            <span slot="end" class="info-value tabular selectable">{{ tracker.downloadCount }}</span>
          </ion-item>
        </template>
      </ion-list>
    </template>

    <div class="tracker-actions">
      <ion-button size="default" @click="addTracker()">
        <ion-icon slot="start" :icon="add"></ion-icon>
        {{ Locale.addTracker }}
      </ion-button>
    </div>

    <ion-infinite-scroll v-if="displayedCount < trackerCount" @ionInfinite="displayMore($event)" threshold="100px">
      <ion-infinite-scroll-content loading-spinner="circular">
        <ion-button fill="clear" @click="displayMore()" :disabled="displayedCount>=trackerCount">
          {{ Locale.displayMore }}
        </ion-button>
      </ion-infinite-scroll-content>
    </ion-infinite-scroll>
  </ion-content>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue';
import { 
  actionSheetController,
  alertController,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonBadge,
  IonInfiniteScroll, 
  IonInfiniteScrollContent,
} from '@ionic/vue';
import {
  ellipsisVerticalOutline,
  ellipsisVerticalSharp,
  add
} from 'ionicons/icons';
import { LocaleController } from "../../services/LocaleController";
import { Locale } from "../../services/Locale";
import { Utils } from "../../services/Utils";
import { TransmissionRPC } from '../../services/TransmissionRPC';
import { Emitter } from '../../services/Emitter';

export default defineComponent({
  components: {
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonBadge,
    IonInfiniteScroll, 
    IonInfiniteScrollContent,
  },
  data() {
    return {
      details:{} as Record<string,any>,
      displayedCount: 0,
      removed:[] as number[],
    }
  },
  watch: {
    "details.trackerStats.length": function() {
      this.removed = [];
    }
  },
  setup() {
    return { 
      Utils,
      Locale,
      LocaleController,
      ellipsisVerticalOutline,
      ellipsisVerticalSharp,
      add
    }
  },
  created() {
    this.details = inject('details') as Record<string,any>;
    this.displayMore();
  },
  mounted() {
    Utils.customScrollbar(this.$refs.content);

    Emitter.on('add-tracker', this.addTracker);
    Emitter.on("unmount-torrent-details", () => {
      Emitter.off('add-tracker', this.addTracker);
    })
  },
  computed: {
    displayedTrackerList: function(): Array<any> {
      const result: Array<any> = [];
      for(let i = 0; i < this.displayedCount; i++){
        if(this.details.trackerStats[i]){
          result.push(this.details.trackerStats[i]);
        }
      }
      
      return result;
    },
    trackerCount: function(): number {
      return this.details.trackerStats.length
    }
  },
  methods: {
    displayMore(ev?: any) {
      if(this.details){
        this.displayedCount=this.displayedCount+5;
      }
      if(this.displayedCount>this.trackerCount){
        this.displayedCount=this.trackerCount;
      }

      if(ev){
        ev.target.complete();
      }
    },
    async addTracker(){
      const alert = await alertController
        .create({
          header: Locale.addTracker,
          inputs: [
            {
              name: 'address',
              placeholder: Locale.address
            }
          ],
          buttons: [
            {
              text: Locale.actions.cancel,
              role: 'cancel'
            },
            {
              text: Locale.ok,
              handler: (data) => {
                const args = {
                  trackerAdd:[data.address]
                }

                TransmissionRPC.invalidatePersitentData();

                TransmissionRPC.torrentAction("set", this.details.id, args)
                  .then((response) => {
                    Utils.responseToast(response.result);
                    const domainDetails = Utils.trackerDomain(data.address);
                    const newId = this.details.trackerStats.length;
                    const newTracker = {
                      id:newId,
                      tier:this.details.trackerStats.length>0 ? this.details.trackerStats[this.details.trackerStats.length-1].tier+1 : 0,
                      announce:data.address,
                      host:domainDetails.protocol+"://"+domainDetails.domain+":"+domainDetails.port,
                      announceState:0,
                      scrapeState:0
                    }
                    this.details.trackerStats[newId] = newTracker;

                    if(this.displayedCount==this.trackerCount-1){
                      this.displayMore();
                    }
                  })
                  .catch((error) => {
                    Utils.responseToast(error.message);
                  })
              },
            },
          ],
        });
      return alert.present();
    },
    async editTracker(tracker: Record<string,any>){
      const alert = await alertController
        .create({
          header: Locale.actions.editAddress,
          inputs: [
            {
              name: 'address',
              value: tracker.announce,
            }
          ],
          buttons: [
            {
              text: Locale.actions.cancel,
              role: 'cancel'
            },
            {
              text: Locale.ok,
              handler: (data) => {
                const args = {
                  trackerReplace:[tracker.id,data.address]
                }

                TransmissionRPC.invalidatePersitentData();

                TransmissionRPC.torrentAction("set", this.details.id, args)
                  .then((response) => {
                    Utils.responseToast(response.result)
                    const domainDetails = Utils.trackerDomain(data.address);
                    this.details.trackerStats[tracker.id].announce = data.address;
                    this.details.trackerStats[tracker.id].host = domainDetails.protocol+"://"+domainDetails.domain+":"+domainDetails.port
                  })
                  .catch((error) => {
                    Utils.responseToast(error.message);
                  })
              },
            },
          ],
        });
      return alert.present();
    },
    async trackerActions(tracker: Record<string,any>) {
      const actionSheet = await actionSheetController
        .create({
          header: Utils.trackerDomain(tracker.host).domain,
          buttons: [
            {
              text: Locale.actions.editAddress,
              handler: () => {
                this.editTracker(tracker);
              },
            },
            {
              text: Locale.actions.remove,
              role: 'destructive',
              handler: () => {
                // Remove tracker
                const args = {
                  "trackerRemove":[tracker.id]
                }
                
                TransmissionRPC.invalidatePersitentData();

                TransmissionRPC.torrentAction("set", this.details.id, args)
                  .then((response) => {
                    Utils.responseToast(response.result);
                    this.removed.push(tracker.announce)
                  })
                  .catch((error) => {
                    Utils.responseToast(error.message);
                  })
              },
            },
            {
              text: Locale.actions.cancel,
              role: 'cancel'
            },
          ],
        });
      return actionSheet.present();
    },
  }
})
</script>

<style scoped>
.tracker-card.removed {
  display: none;
}

ion-item.tracker-header-item {
  --background: var(--raised);
  --border-color: var(--line);
  --min-height: 44px;
}

.tracker-title {
  display: flex !important;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tracker-title .domain {
  font-size: var(--fs-body);
  font-weight: 600;
  color: var(--ink);
  margin-inline-end: 2px;
}

.tracker-menu-btn {
  --color: var(--muted);
  --padding-start: 8px;
  --padding-end: 8px;
  margin: 0;
  height: 32px;
  width: 32px;
}

.tracker-menu-btn ion-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
}

.info-value {
  font-size: var(--fs-body);
  color: var(--ink);
}

.info-value .muted {
  color: var(--muted);
}

.state-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 65%;
  text-align: end;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: 0 0 6px;
  background: var(--neutral);
}

.dot.positive { background: var(--positive); }
.dot.warning  { background: var(--warning); }
.dot.negative { background: var(--negative); }
.dot.neutral  { background: var(--neutral); }

.error {
  color: var(--negative);
  overflow-wrap: anywhere;
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

.tracker-actions {
  padding: 4px 0 12px;
  display: flex;
  align-items: center;
}

.tracker-actions ion-button ion-icon {
  font-size: 16px !important;
  width: 16px !important;
  height: 16px !important;
  margin-inline-end: 6px;
}
</style>