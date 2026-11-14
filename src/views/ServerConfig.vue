<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-back-button defaultHref="#" @click="modalClose()"></ion-back-button>
      </ion-buttons>
      <ion-title>{{ Locale.serverConfig }}</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="saveSettings()" fill="clear" aria-label="Save">
          <ion-icon slot="icon-only" :ios="saveOutline" :md="saveSharp"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
    <ion-toolbar>
      <ion-segment ref="tabs" @ionChange="tabController.setTab($event.detail.value)" v-model="tabController.state.selectedTab" scrollable>
        <ion-segment-button :value="0" id="tab1">
          <ion-label>{{ Locale.download }}</ion-label>
        </ion-segment-button>
        <ion-segment-button :value="1" id="tab2">
          <ion-label>{{ Locale.limits }}</ion-label>
        </ion-segment-button>
        <ion-segment-button :value="2" id="tab3">
          <ion-label>{{ Locale.network }}</ion-label>
        </ion-segment-button>
      </ion-segment>
    </ion-toolbar>
  </ion-header>
  
  <div class="swiper" ref="swiper">
    <div class="swiper-wrapper">
      <!-- Download tab -->
      <div class="swiper-slide" role="tabpanel" aria-labelledby="tab1" :aria-hidden="tabController.state.selectedTab!=0">
        <ion-content class="ion-padding" ref="tab1">
          <ion-list>
            <ion-list-header>
              <ion-label>
                {{ Locale.general }}
              </ion-label>
            </ion-list-header>

            <ion-item>
              <ion-input :label="Locale.defaultDownloadDir" label-placement="stacked" v-model="config['download-dir']"></ion-input>
            </ion-item>

            <ion-item>
              <ion-input :label="Locale.cacheSize + ' (M' + Locale.units.byte + ')'" label-placement="stacked" v-model.number="config['cache-size-mb']" type="number"></ion-input>
            </ion-item>

            <ion-item>
              <ion-toggle v-model="config['start-added-torrents']" justify="space-between" class="swiper-no-swiping">{{ Locale.startAddedTorrents }}</ion-toggle>
            </ion-item>
          </ion-list>

          <ion-list>
            <ion-list-header>
              <ion-label>
                {{ Locale.queue }}
              </ion-label>
            </ion-list-header>

            <ion-item>
              <ion-toggle v-model="config['download-queue-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.enabled }}</ion-toggle>
            </ion-item>

            <ion-item :disabled="!config['download-queue-enabled']">
              <ion-input :label="Locale.queueSize" label-placement="stacked" v-model.number="config['download-queue-size']" type="number"></ion-input>
            </ion-item>

            <ion-item>
              <ion-input :label="Locale.stopWhenInactive" label-placement="stacked" v-model.number="config['queue-stalled-minutes']" type="number" :disabled="!config['queue-stalled-enabled']"></ion-input>
              <span class="swiper-no-swiping" slot="end">
                <ion-toggle v-model="config['queue-stalled-enabled']" :aria-label="Locale.stopWhenInactive"></ion-toggle>
              </span>
            </ion-item>
          </ion-list>

          <ion-list>
            <ion-list-header>
              <ion-label>
                {{ Locale.incompleteDownloads }}
              </ion-label>
            </ion-list-header>

            <ion-item>
              <ion-toggle v-model="config['rename-partial-files']" justify="space-between" class="swiper-no-swiping">{{ Locale.addPartExt }}</ion-toggle>
            </ion-item>

            <ion-item>
              <ion-toggle v-model="config['incomplete-dir-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.useTempDir }}</ion-toggle>
            </ion-item>

            <ion-item :disabled="!config['incomplete-dir-enabled']">
              <ion-input :label="Locale.tempDirPath" label-placement="stacked" v-model="config['incomplete-dir']"></ion-input>
            </ion-item>
          </ion-list>

        </ion-content>

      </div>

      <!-- Limits tab -->
      <div class="swiper-slide" role="tabpanel" aria-labelledby="tab2" :aria-hidden="tabController.state.selectedTab!=1">
        <ion-content class="ion-padding" ref="tab2">

          <ion-list>
            <ion-list-header>
              <ion-label>
                {{ Locale.bandwidth }}
              </ion-label>
            </ion-list-header>

            <ion-item>
              <ion-input :label="Locale.downloadLimit + ' (' + speedUnit + ')'" label-placement="stacked" v-model.number="config['speed-limit-down']" type="number" :disabled="!config['speed-limit-down-enabled']"></ion-input>
              <span class="swiper-no-swiping" slot="end">
                <ion-toggle v-model="config['speed-limit-down-enabled']" :aria-label="Locale.downloadLimit"></ion-toggle>
              </span>
            </ion-item>
            
            <ion-item>
              <ion-input :label="Locale.uploadLimit + ' (' + speedUnit + ')'" label-placement="stacked" v-model.number="config['speed-limit-up']" type="number" :disabled="!config['speed-limit-up-enabled']"></ion-input>
              <span class="swiper-no-swiping" slot="end">
                <ion-toggle v-model="config['speed-limit-up-enabled']" :aria-label="Locale.uploadLimit"></ion-toggle>
              </span>
            </ion-item>
          </ion-list>

          <ion-list>
            <ion-list-header>
              <ion-label>
                {{ Locale.altSpeed }}
              </ion-label>
            </ion-list-header>

            <ion-item>
              <ion-toggle v-model="config['alt-speed-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.enabled }}</ion-toggle>
            </ion-item>

            <ion-item>
              <ion-input :label="Locale.downloadLimit + ' (' + speedUnit + ')'" label-placement="stacked" v-model.number="config['alt-speed-down']" type="number"></ion-input>
            </ion-item>

            <ion-item>
              <ion-input :label="Locale.uploadLimit + ' (' + speedUnit + ')'" label-placement="stacked" v-model.number="config['alt-speed-up']" type="number"></ion-input>
            </ion-item>
          </ion-list>

          <ion-list>
            <ion-list-header>
              <ion-label>
                {{ Locale.altSpeedScheduler }}
              </ion-label>
            </ion-list-header>

            <ion-item>
              <ion-toggle v-model="config['alt-speed-time-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.enabled }}</ion-toggle>
            </ion-item>

            <ion-item :disabled="!config['alt-speed-time-enabled']">
              <ion-input :label="Locale.altSpeedBegin" label-placement="stacked" type="time" v-model="altSpeedTimeBegin"/>
            </ion-item>

            <ion-item :disabled="!config['alt-speed-time-enabled']">
              <ion-input :label="Locale.altSpeedEnd" label-placement="stacked" type="time" v-model="altSpeedTimeEnd"/>
            </ion-item>

            <ion-item :disabled="!config['alt-speed-time-enabled']">
              <ion-select :label="Locale.altSpeedDays" label-placement="stacked" :placeholder="Locale.never" :multiple="true" v-model="altSpeedTimeDay">
                <ion-select-option v-for="(day,id) in getWeekDays" :value="id" :key="id">{{day}}</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>

          <ion-list>
            <ion-list-header>
              <ion-label>
                {{ Locale.seed }}
              </ion-label>
            </ion-list-header>

            <ion-item>
              <ion-input :label="Locale.seedRatioLimit" label-placement="stacked" v-model.number="config.seedRatioLimit" type="number" :disabled="!config.seedRatioLimited"></ion-input>
              <span class="swiper-no-swiping" slot="end">
                <ion-toggle v-model="config.seedRatioLimited" :aria-label="Locale.seedRatioLimit"></ion-toggle>
              </span>
            </ion-item>

            <ion-item>
              <ion-input :label="Locale.stopWhenInactive" label-placement="stacked" v-model.number="config['idle-seeding-limit']" type="number" :disabled="!config['idle-seeding-limit-enabled']"></ion-input>
              <span class="swiper-no-swiping" slot="end">
                <ion-toggle v-model="config['idle-seeding-limit-enabled']" :aria-label="Locale.stopWhenInactive"></ion-toggle>
              </span>
            </ion-item>
          </ion-list>

          <ion-list>
            <ion-list-header>
              <ion-label>
                {{ LocaleController.getForm("peer","other") }}
              </ion-label>
            </ion-list-header>

            <ion-item>
              <ion-input :label="Locale.globalPeerLimit" label-placement="stacked" v-model.number="config['peer-limit-global']" type="number"></ion-input>
            </ion-item>

            <ion-item>
              <ion-input :label="Locale.peerLimitByTorrent" label-placement="stacked" v-model.number="config['peer-limit-per-torrent']" type="number"></ion-input>
            </ion-item>
          </ion-list>

        </ion-content>
      </div>

      <!-- Network tab -->
      <div class="swiper-slide" role="tabpanel" aria-labelledby="tab3" :aria-hidden="tabController.state.selectedTab!=2">
        <ion-content class="ion-padding" ref="tab3">
          <ion-list>
            <ion-list-header>
              <ion-label>
                {{ Locale.general }}
              </ion-label>
            </ion-list-header>

            <ion-item>
              <ion-select :label="Locale.encryption" label-placement="start" justify="space-between" placeholder="Select One" v-model="config.encryption" :okText="Locale.ok" :cancelText="Locale.actions.cancel"> 
                <ion-select-option value="required">{{ Locale.required }}</ion-select-option>
                <ion-select-option value="preferred">{{ Locale.preferred }}</ion-select-option>
                <ion-select-option value="tolerated">{{ Locale.tolerated }}</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>

          <ion-list>
            <ion-list-header>
              <ion-label>
                {{ Locale.peerPort }}
              </ion-label>
            </ion-list-header>

            <ion-item :disabled="config['peer-port-random-on-start']">
              <ion-input :label="Locale.port" label-placement="stacked" v-model.number="config['peer-port']" type="number"></ion-input>
            </ion-item>

            <ion-item>
              <ion-toggle v-model="config['peer-port-random-on-start']" justify="space-between" class="swiper-no-swiping">{{ Locale.randomPortOnStart }}</ion-toggle>
            </ion-item>

            <ion-item>
              <ion-toggle v-model="config['port-forwarding-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.portForwarding }}</ion-toggle>
            </ion-item>

            <div class="ion-padding small">
              <ion-button size="default" @click="testPort()">{{ Locale.testPort }}</ion-button>
              <span v-if="portStatus !== null" class="port-status" :class="portStatus ? 'open' : 'closed'" role="status">
                <span class="dot" aria-hidden="true"></span>
                <span class="tabular">{{ config['peer-port'] }}: {{ portStatus ? Locale.success : Locale.error.error }}</span>
              </span>
            </div>
          </ion-list>

          <ion-list>
            <ion-list-header>
              <ion-label>
                {{ Locale.protocols }}
              </ion-label>
            </ion-list-header>

            <ion-item>
              <ion-toggle v-model="config['dht-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.DHT }} (DHT)</ion-toggle>
            </ion-item>

            <ion-item>
              <ion-toggle v-model="config['lpd-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.LPD }} (LPD)</ion-toggle>
            </ion-item>

            <ion-item>
              <ion-toggle v-model="config['pex-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.PEX }} (PEX)</ion-toggle>
            </ion-item>

            <ion-item>
              <ion-toggle v-model="config['utp-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.UTP }} (µTP)</ion-toggle>
            </ion-item>
          </ion-list>

          <ion-list>
            <ion-list-header>
              <ion-label>
                {{ Locale.blocklist }}
              </ion-label>
            </ion-list-header>

            <ion-item>
              <ion-toggle v-model="config['blocklist-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.enabled }}</ion-toggle>
            </ion-item>

            <ion-item :disabled="!config['blocklist-enabled']">
              <ion-input :label="Locale.blocklistUrl" label-placement="stacked" v-model="config['blocklist-url']"></ion-input>
            </ion-item>

            
            <div class="ion-padding small">
              <ion-button size="default" @click="updateBlocklist()">{{ Locale.updateBlocklist }}</ion-button>
            </div>
          </ion-list>

        </ion-content>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { 
  modalController,
  loadingController,
  IonContent,
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonList,
  IonIcon,
  IonButton,
  IonLabel,
  IonListHeader,
  IonItem,
  IonInput,
  IonToggle,
  IonSelect,
  IonSelectOption
} from '@ionic/vue';
import {
  saveOutline,
  saveSharp
} from 'ionicons/icons';
import TabController from '../services/TabController';
import { TransmissionRPC } from "../services/TransmissionRPC";
import { UserSettings } from "../services/UserSettings";
import { Utils } from "../services/Utils";
import { Locale } from "../services/Locale";
import { LocaleController } from "../services/LocaleController";
import * as _ from 'lodash';

export default defineComponent({
  name: 'Server configuration',
  components: { 
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonList,
    IonIcon,
    IonButton,
    IonLabel,
    IonListHeader,
    IonItem,
    IonInput,
    IonToggle,
    IonSelect,
    IonSelectOption
  },
  data() {
    return {
      config: _.clone(TransmissionRPC.sessionArguments),
      portStatus: null as null | boolean,
    }
  },
  setup() {
    Utils.pushState();

    const tabController = new TabController();

    return { 
      Locale,
      LocaleController,
      Utils,
      tabController,
      saveOutline,
      saveSharp
    }
  },
  created() {
    if(UserSettings.state.useBits){
      // Bytes to bits
      this.config['alt-speed-up'] = this.config['alt-speed-up']*8;
      this.config['alt-speed-down'] = this.config['alt-speed-down']*8;
      this.config['speed-limit-up'] = this.config['speed-limit-up']*8;
      this.config['speed-limit-down'] = this.config['speed-limit-down']*8;
    }
  },
  async mounted() {
    Utils.customScrollbar(this.$refs.tab1)
    Utils.customScrollbar(this.$refs.tab2)
    Utils.customScrollbar(this.$refs.tab3)
    
    this.tabController.init(this.$refs.swiper, this.$refs.tabs);
  },
  beforeUnmount() {
    this.tabController.destroy();
  },
  computed: {
    speedUnit:() => {
      return 'K' + (UserSettings.state.useBits ? Locale.units.bit : Locale.units.byte) + Locale.units.perSecond
    },
    altSpeedTimeBegin: {
      get(): string {
        return this.minutesToHhmm(this.config['alt-speed-time-begin']);
      },
      set (value: string) {
        this.config['alt-speed-time-begin'] = this.HhmmToMinutes(value);
      }
    },
    altSpeedTimeEnd: {
      get(): string {
        return this.minutesToHhmm(this.config['alt-speed-time-end']);
      },
      set (value: string) {
        this.config['alt-speed-time-end'] = this.HhmmToMinutes(value);
      }
    },
    altSpeedTimeDay: {
      get(): Array<number> {
        const binary = (this.config['alt-speed-time-day'] >>> 0).toString(2).padStart(7,'0');
        const numbers=[];
        for (let i = 1; i < 7; i++) {
          if(binary[i]=='1'){
            numbers.push(i-1);
          }
        }
        if(binary[0]=='1'){
          numbers.push(6);
        }
        return numbers;
      },
      set (value: Array<number>) {
        let binary=value.includes(6) ? '1' : '0';
        for (let i = 0; i < 6; i++) {
          binary+=value.includes(i) ? '1' : '0';
        }
        this.config['alt-speed-time-day'] = parseInt(binary, 2);
      }
    },
    getWeekDays(){
      const locale = UserSettings.getLanguage();
      const baseDate = new Date(Date.UTC(2017, 0, 2));
      const weekDays = [];
      for(let i = 0; i < 7; i++)
      {
        const day = baseDate.toLocaleDateString(locale, { weekday: 'long' })
          .split(' ')
          .map(w => w.substring(0,1).toUpperCase()+w.substring(1))
          .join(' ')
        weekDays.push(day);
        baseDate.setDate(baseDate.getDate() + 1);       
      }
      return weekDays;
    }
  },
  methods: {
    modalClose () {
      modalController.dismiss();
    },
    minutesToHhmm(minutes: number) {
      const hours = Math.floor(minutes/60);
      const min = minutes%60;
      return `${hours.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
    },
    HhmmToMinutes(hhmm: string) {
      const parts = hhmm.split(':');
      return parseInt(parts[0])*60 + parseInt(parts[1]);
    },
    async updateBlocklist() {
      const loading = await loadingController.create({});
      await loading.present();
      await TransmissionRPC.rpcCall("blocklist-update")
        .then((response) => {
          const size = response.arguments['blocklist-size'].toLocaleString(UserSettings.getLanguage());
          Utils.responseToast(Locale.formatString(Locale.blocklistSize,size).toString());
        })
        .catch((error) => {
          Utils.responseToast(error.message);
        })
      loading.dismiss();
    },
    async testPort() {
      const loading = await loadingController.create({});
      await loading.present();
      await TransmissionRPC.rpcCall("port-test")
        .then((response) => {
          const isOpen = Boolean(response.arguments && (response.arguments['port-is-open'] ?? response.arguments['port_is_open']));
          this.portStatus = isOpen;
          Utils.responseToast(isOpen ? "success" : Locale.error.error);
        })
        .catch((error) => {
          this.portStatus = null;
          Utils.responseToast(error.message);
        })
      loading.dismiss();
    },
    async saveSettings() {
      const loading = await loadingController.create({});
      await loading.present();

      const tmpArgs = _.clone(this.config)
      const args: Record<string,any>={};

      if(UserSettings.state.useBits){
        // Bits to bytes
        tmpArgs['alt-speed-up'] = Math.round(tmpArgs['alt-speed-up']/8);
        tmpArgs['alt-speed-down'] = Math.round(tmpArgs['alt-speed-down']/8);
        tmpArgs['speed-limit-up'] = Math.round(tmpArgs['speed-limit-up']/8);
        tmpArgs['speed-limit-down'] = Math.round(tmpArgs['speed-limit-down']/8);
      }

      for(const key in tmpArgs){
        if(!_.isEqual(tmpArgs[key],TransmissionRPC.sessionArguments[key])){
          args[key]=tmpArgs[key];
        }
      }
      
      await TransmissionRPC.setSession(args)
        .then((response)=> {
          Utils.responseToast(response.result)
        })
      loading.dismiss()
    }
    
  },
});
</script>

<style scoped>
ion-content {
  text-align: initial;
}

.left {
  position: absolute;
  bottom: 0px;
}

div[slot="start"]{
  max-width: calc(100% - 68px);
  margin-inline-end:0px;
}

.port-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  border-radius: 13px;
  font-size: var(--fs-small);
  font-weight: 500;
}

.port-status .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.port-status.open {
  color: var(--positive);
  background: rgba(108, 199, 149, 0.14);
}

.port-status.closed {
  color: var(--negative);
  background: var(--pill-negative-bg);
}
</style>
