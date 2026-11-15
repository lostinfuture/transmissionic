<template>
  <VirtualScroll ref="content" :items="details.peers" :item-size="56" key-field="address">
    <template v-slot:start>
      <div class="list-head">
        <span class="tabular">
          {{ details.peers.length }}
          {{ LocaleController.getPlural("peer",details.peers.length) }}
        </span>
      </div>
    </template>

    <template v-slot:default="{item}">
      <div class="peer">
        <div class="peer-main">
          <div class="peer-host tabular" translate="no">
            <img v-if="flagEnabled" class="flag" v-bind="flagAttributes(item.address)" @click="countryName(item.address)" alt="">
            <span class="selectable">{{ item.address }}</span>
            <ion-icon v-if="item.isEncrypted" class="lock" :ios="lockClosedOutline" :md="lockClosedSharp" aria-hidden="true"></ion-icon>
          </div>
          <div class="peer-client selectable" translate="no">{{ item.clientName }}</div>
        </div>
        <div class="peer-details tabular">
          <span class="rate down" :class="{ idle: !(item.rateToClient > 0) }">
            ↓&nbsp;{{ Utils.formatBytes(item.rateToClient,1,true) }}
          </span>
          <span class="rate up" :class="{ idle: !(item.rateToPeer > 0) }">
            ↑&nbsp;{{ Utils.formatBytes(item.rateToPeer,1,true) }}
          </span>
          <span class="progress">{{ Utils.getPercent(item.progress) }}</span>
        </div>
      </div>
    </template>
  </VirtualScroll>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue';
import { 
  IonIcon,
} from '@ionic/vue';
import {
  lockClosedOutline,
  lockClosedSharp
} from 'ionicons/icons';
import VirtualScroll from './VirtualScroll.vue';
import { UserSettings } from "../../services/UserSettings";
import { LocaleController } from "../../services/LocaleController";
import { Locale } from "../../services/Locale";
import { Utils } from "../../services/Utils";

let regionNames: Intl.DisplayNames;

export default defineComponent({
  components: {
    VirtualScroll,
    IonIcon,
  },
  data() {
    return {
      details:{} as Record<string,any>,
      flags:{} as Record<string,any>
    }
  },
  computed: {
    flagEnabled() {
      return UserSettings.state.ipFlags;
    }
  },
  setup() {
    return { 
      Utils,
      Locale,
      LocaleController,
      lockClosedOutline,
      lockClosedSharp
    }
  },
  created() {
    this.details = inject('details') as Record<string,any>;

    try {
      regionNames = new Intl.DisplayNames(
        [UserSettings.getLanguage()], {type: 'region'}
      );
    } catch (e) { console.error('Intl.DisplayNames not supported') }
  },
  methods: {
    flagAttributes(adress: string) {
      if(UserSettings.state.ipFlags){
        if(!this.flags[adress]){
          this.loadFlag(adress);
        }
        return this.flags[adress];
      }
    },
    async countryName(adress: string) {
      Utils.responseToast(this.flags[adress].name)
    },
    async loadFlag(adress: string){
      const ipDetails = await Utils.ipToCountry(adress);
      if(ipDetails){
        let name=ipDetails.country;
        if(regionNames){
          name=regionNames.of(ipDetails.country);
        }
        this.flags[adress] = {
          src:`./assets/flags/${ipDetails.country}.png`,
          name
        }
      }
    }
  }
})
</script>

<style scoped>
.list-head {
  box-sizing: border-box;
  height: 42px;
  padding: 0 16px;
  background: var(--raised);
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  font-size: var(--fs-body);
  font-weight: 600;
  color: var(--ink);
  text-align: start;
}

.peer {
  box-sizing: border-box;
  height: 56px;
  border-bottom: 1px solid var(--rule);
  text-align: start;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.peer-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.peer-host {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-body);
  font-weight: 500;
  color: var(--ink);
  white-space: nowrap;
  flex: 0 0 auto;
}

.flag {
  height: 14px;
  width: auto;
  object-fit: cover;
  border-radius: 2px;
  cursor: pointer;
}

.lock {
  font-size: 14px;
  width: 14px;
  height: 14px;
  color: var(--muted);
}

.peer-client {
  font-size: var(--fs-small);
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: end;
  min-width: 0;
}

.peer-details {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: var(--fs-small);
  color: var(--muted);
}

.rate.down {
  color: var(--positive);
}

.rate.up {
  color: var(--info);
}

.rate.idle {
  color: var(--faint);
}

.progress {
  margin-inline-start: auto;
  color: var(--ink);
  font-weight: 500;
}
</style>