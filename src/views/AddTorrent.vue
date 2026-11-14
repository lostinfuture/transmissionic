<template>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="#" @click="modalClose()"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ multiple ? Locale.addTorrents : Locale.addTorrent }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="serverList()" fill="clear" :aria-label="Locale.servers">
            <ion-icon slot="icon-only" :ios="serverOutline" :md="serverSharp"></ion-icon>
          </ion-button>
          <ion-button @click="add()" fill="clear" :disabled="!connectionStatus.connected" :aria-label="Locale.add">
            <ion-icon slot="icon-only" :ios="checkmarkOutline" :md="checkmarkSharp"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment ref="tabs" @ionChange="tabController.setTab($event.detail.value)" v-model="tabController.state.selectedTab" scrollable>
          <ion-segment-button value="0" id="tab1">
            <ion-label>{{ Locale.general }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="1" v-if="!multiple" :disabled="!data.files" id="tab2">
            <ion-label>{{ Locale.files }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="1" v-else id="tab2">
            <ion-label class="text-transform">{{ LocaleController.getForm("torrent","other") }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ConnectionStatus 
      v-if="connectionStatus.loading || connectionStatus.error!=''"
      v-on:retry="retry()">
    </ConnectionStatus>

    <div class="swiper" ref="swiper" v-show="connectionStatus.connected">
      <div class="swiper-wrapper">
        <!-- General tab --> 
        <div class="swiper-slide" role="tabpanel" aria-labelledby="tab1" :aria-hidden="tabController.state.selectedTab!=0">

          <ion-content class="ion-padding" ref="content">

            <ion-list>
              <ion-list-header>
                <ion-label>
                  {{ Locale.preset }}
                </ion-label>
              </ion-list-header>

              <div id="presets" class="swiper-no-swiping">

                <ion-chip @click="addPreset()">
                  <ion-label>{{ Locale.add }}</ion-label>
                  <ion-icon :ios="addOutline" :md="addSharp"></ion-icon>
                </ion-chip>

                <ion-chip v-for="(preset,name) in presets" :key="name" @click="selectPreset(name)" :color="selectedPreset==name ? 'primary' : undefined">
                  <ion-label>{{name}}</ion-label>
                  <ion-icon :ios="closeOutline" :md="closeSharp" @click="removePreset(name,$event)"></ion-icon>
                </ion-chip>
              </div>
            </ion-list>

            <ion-list>
              <ion-list-header>
                <ion-label>
                  {{ Locale.options }}
                </ion-label>
              </ion-list-header>

              <ion-item class="autocomplete" v-if="connectionStatus.connected">
                <div class="stacked-field swiper-no-swiping">
                  <span class="field-label">{{ Locale.downloadDir }}</span>
                  <autocomplete 
                    :aria-label="Locale.downloadDir"
                    :value="settings.downloadDir"
                    :items="TransmissionRPC.persistentData.downloadDir"
                    :placeholder="defaultDownloadDir"
                    v-on:update="setDownloadDir">
                  </autocomplete>
                </div>
              </ion-item>

              <ion-item>
                <ion-toggle v-model="settings.start" justify="space-between" class="swiper-no-swiping">{{ Locale.actions.start }}</ion-toggle>
              </ion-item>

              <ion-item>
                <ion-select :label="Locale.priority.priority" label-placement="start" justify="space-between" placeholder="Select One" v-model="settings.bandwidthPriority" :okText="Locale.ok" :cancelText="Locale.actions.cancel">
                  <ion-select-option :value="1">{{ Locale.priority.high }}</ion-select-option>
                  <ion-select-option :value="0">{{ Locale.priority.normal }}</ion-select-option>
                  <ion-select-option :value="-1">{{ Locale.priority.low }}</ion-select-option>
                </ion-select>
              </ion-item>
            </ion-list>

            <ion-list>
              <ion-list-header>
                <ion-label>
                  {{ Locale.information }}
                </ion-label>
              </ion-list-header>

              <ion-item v-if="multiple">
                <ion-label class="text-transform">{{ LocaleController.getForm("torrent","other") }}</ion-label>
                <span slot="end" class="info-val tabular selectable">{{files.length}}</span>
              </ion-item>

              <ion-item v-if="type=='url' && !multiple">
                <div class="stacked-field">
                  <span class="field-label">URL</span>
                  <span class="info-block selectable">{{files[0].torrent}}</span>
                </div>
              </ion-item>

              <ion-item v-if="data.name">
                <div class="stacked-field">
                  <span class="field-label">{{ Locale.name }}</span>
                  <span class="info-block selectable">{{data.name}}</span>
                </div>
              </ion-item>

              <ion-item v-if="totalSize">
                <ion-label>{{ Locale.totalSize }}</ion-label>
                <span slot="end" class="info-val tabular selectable">{{Utils.formatBytes(totalSize)}}</span>
              </ion-item>

              <ion-item v-if="data.files">
                <ion-label>{{ Locale.files }}</ion-label>
                <span slot="end" class="info-val tabular selectable">{{ data.files.length }}</span>
              </ion-item>

              <ion-item v-if="data.length && data.pieceLength">
                <ion-label>{{ Locale.pieces }}</ion-label>
                <span slot="end" class="info-val tabular selectable">{{ Math.ceil(data.length/data.pieceLength) }} × {{ Utils.formatBytes(data.pieceLength) }}</span>
              </ion-item>
              
              <ion-item v-if="data.comment">
                <div class="stacked-field">
                  <span class="field-label">{{ Locale.comment }}</span>
                  <span class="info-block selectable" v-html="Utils.autoLink(data.comment)"></span>
                </div>
              </ion-item>

              <ion-item v-if="data.infoHash">
                <div class="stacked-field">
                  <span class="field-label">{{ Locale.hash }}</span>
                  <span class="info-block code selectable">{{data.infoHash}}</span>
                </div>
              </ion-item>

              <ion-item v-if="data.announce && data.announce.length>0">
                <ion-label>{{ Locale.tracker.one }}</ion-label>
                <span slot="end" class="info-val selectable">{{ Utils.trackerDomain(data.announce[0]).domain }}</span>
              </ion-item>
            </ion-list>
          </ion-content>

        </div>
        <!-- Files tab -->
        <div class="swiper-slide" v-if="!multiple && data.files" role="tabpanel" aria-labelledby="tab2" :aria-hidden="tabController.state.selectedTab!=1">
          <Files :actions="false" v-on:changeDirectory="changeDirectory"></Files>
        </div>
        <!-- Torrents tab -->
        <div class="swiper-slide" v-if="multiple" role="tabpanel" aria-labelledby="tab2" :aria-hidden="tabController.state.selectedTab!=1">
          <VirtualScroll v-bind="$attrs" :items="files" :item-size="64">
            <template v-slot:default="{item}">
              <div class="torrent">
                <div class="side">
                  <ion-checkbox
                    :aria-label="item.data.name || item.torrent"
                    v-bind="checkedAttributes(item.data.infoHash)"
                    v-on:ionChange="checboxUpdate($event,item.data.infoHash)">
                  </ion-checkbox>
                </div>
                <div class="middle" @click="fileTitle(item.data.name || item.torrent)" @contextmenu="fileTitle(item.data.name || item.torrent, $event)">
                  <div class="name">
                    {{item.data.name || item.torrent}}
                  </div>
                  <div class="details">
                    <ion-icon color="medium" :ios="documentOutline" :md="documentSharp"></ion-icon>

                    {{ Utils.formatBytes(item.data.length) }}
                  </div>
                </div>
              </div>
            </template>
          </VirtualScroll>
        </div>
      </div>
    </div>
    
</template>

<script lang="ts">
import { defineComponent, computed, inject } from 'vue';
import { 
  modalController,
  alertController,
  loadingController,
  actionSheetController,
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonButton,
  IonButtons,
  IonBackButton,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonCheckbox,
  IonChip
} from '@ionic/vue';
import {
  checkmarkOutline,
  checkmarkSharp,
  documentOutline,
  documentSharp,
  closeOutline,
  closeSharp,
  addOutline,
  addSharp,
  serverOutline,
  serverSharp
} from 'ionicons/icons';
import ConnectionStatus from './components/ConnectionStatus.vue';
import Autocomplete from './components/Autocomplete.vue';
import VirtualScroll from './components/VirtualScroll.vue';
import Files from './components/Files.vue';
import Preset from './Preset.vue';
import TabController from '../services/TabController';
import { Utils } from "../services/Utils";
import { Locale } from "../services/Locale";
import { LocaleController } from "../services/LocaleController";
import { Emitter } from "../services/Emitter";
import { TransmissionRPC } from "../services/TransmissionRPC";
import { UserSettings } from '../services/UserSettings';
import * as _ from 'lodash';

export default defineComponent({
  name: 'AddTorrent',
  props: ["files","type"],
  components: { 
    ConnectionStatus,
    Autocomplete,
    Files,
    VirtualScroll,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonButton,
    IonButtons,
    IonBackButton,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonToggle,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonCheckbox,
    IonChip,
  },
  data() {
    return {
      settings:{
        start:true,
        bandwidthPriority:0,
        downloadDir:"",
      },
      defaultDownloadDir:"",
      currentDirectory:"",
      fileStats:[] as Array<any>,
      notWanted:[] as Array<string>,
      presets:{} as Record<string,any>,
      selectedPreset:"",
      connectionStatus: {} as Record<string,any>,
    }
  },
  computed: {
    multiple(): boolean {
      return this.files.length>1
    },
    data(): Record<string,any> {
      return this.multiple ? {} : this.files[0].data;
    },
    totalSize(): number|null {
      let result=0;
      this.files.forEach((file: Record<string,any>) => {
        result=result+file.data.length
      })
      return result>0 ? result : null;
    }
  },
  provide() {
    return {
      id: -1,
      details: this.data,
      fileStats: this.data.files,
      currentDirectory: computed(() => this.currentDirectory)
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
      TransmissionRPC,
      checkmarkOutline,
      checkmarkSharp,
      documentOutline,
      documentSharp,
      closeOutline,
      closeSharp,
      addOutline,
      addSharp,
      serverOutline,
      serverSharp
    }
  },
  async created() {
    this.connectionStatus = inject('connectionStatus') as Record<string,any>;

    if(!this.multiple && this.data.files){
      this.fileStats = _.clone(this.data.files);
      this.fileStats.forEach((file: Record<string,any>) => {
        file.wanted=true;
        file.name=file.path;
      });
    }

    this.presets = await UserSettings.loadPresets();
    this.defaultDownloadDir = await TransmissionRPC.getSessionArgument('download-dir') || "";

    if(UserSettings.state.rememberSelectedPreset && UserSettings.state.selectedPreset){
      this.selectPreset(UserSettings.state.selectedPreset);
    }
    else if(!this.settings.downloadDir){
      this.settings.downloadDir = this.defaultDownloadDir;
    }
  },
  watch: {
    'connectionStatus.connected'(connected: boolean) {
      if(connected){
        this.$nextTick(() => this.tabController.layout());
      }
    }
  },
  mounted() {
    Utils.customScrollbar(this.$refs.content);

    this.tabController.init(this.$refs.swiper, this.$refs.tabs);
  },
  beforeUnmount() {
    this.tabController.destroy();
  },
  methods: {
    modalClose() {
      modalController.dismiss();
    },
    retry() {
      Emitter.emit("refresh",true);
    },
    changeDirectory(directory: string) {
      this.currentDirectory=directory;
    },
    setDownloadDir(directory: string) {
      this.settings.downloadDir=directory;
    },
    fileTitle(title: string, e?: Event){
      if(e){
        e.preventDefault();
      }
      Utils.responseToast(title)
    },
    checkedAttributes(hash: string) {
      return {
        checked:!this.notWanted.includes(hash)
      }
    },
    checboxUpdate(e: any, hash: string) {
      if(e.detail.checked){
        this.notWanted.splice(this.notWanted.indexOf(hash), 1);
      }
      else {
        this.notWanted.push(hash)
      }
    },
    async add(){
      let error = false;

      const args = {
        paused:!this.settings.start
      } as Record<string,any>;
      
      const dir = this.settings.downloadDir;
      if(dir && dir !== Locale.downloadDir){
        args["download-dir"]=dir;
      }

      const wanted=[];
      const unwanted=[];

      for(const file in this.fileStats){
        const id = parseInt(file);

        if(this.fileStats[id].wanted){
          wanted.push(id);
        }
        else {
          unwanted.push(id);
        }
      }

      if(wanted.length>0){
        args["files-wanted"]=wanted;
      }
      if(unwanted.length>0){
        args["files-unwanted"]=unwanted;
      }
      
      const loading = await loadingController.create({});
      await loading.present();
      
      await this.sendFiles(args)
        .catch((e: Error) => {
          Utils.responseToast(e.message);
          error = true;
        });

      await loading.dismiss();

      if(!error){
        Utils.responseToast("success");
        this.modalClose();
      }
    },
    async sendFiles(args: Record<string,any>){
      for(const torrentFile of this.files) {
        if(!this.notWanted.includes(torrentFile.data.infoHash)){
          await this.send(args,torrentFile.torrent)
            .then(async (result) => {
              await this.applyPreset(result.arguments);
            })
            .catch((e) => {
              throw new Error(this.multiple ? `${e.message}: ${torrentFile.data.name}` : e.message);
            })
        }
      }
    },
    send(args: Record<string,any>,torrent:string) {
      switch (this.type) {
        case "magnet":
        case "url":
          args.filename=torrent
          break;
        case "file":
          args.metainfo=torrent
          break;
      }

      const payload: Record<string, any> = {...this.settings, ...args};
      // The RPC argument is download-dir. downloadDir would be sent as download_dir.
      delete payload.downloadDir;
      return TransmissionRPC.torrentAdd(payload);
    },
    selectPreset(name: string){
      this.selectedPreset = this.selectedPreset==name ? "" : name;
      UserSettings.setValue("selectedPreset", this.selectedPreset, true);
      if(this.selectedPreset!=""){
        this.settings = {...this.presets[name]};
        if(!this.settings.downloadDir){
          this.settings.downloadDir = this.defaultDownloadDir;
        }
      }
      else {
        this.settings = {
          start:true,
          bandwidthPriority:0,
          downloadDir:this.defaultDownloadDir
        }
      }
    },

    async applyPreset(args: Record<string,any>) {
      if(args["torrent-added"] && this.presets[this.selectedPreset]){
        if(this.presets[this.selectedPreset].other.downloadLimited || this.presets[this.selectedPreset].other.uploadLimited){
          await TransmissionRPC.torrentAction("set",[args["torrent-added"].id],this.presets[this.selectedPreset].other)
            .catch((error) => {
              Utils.responseToast(error.message);
            })
        }
      }
    },

    async addPreset() {
      const modal = await modalController
        .create({
          component: Preset
        })
      modal.onDidDismiss()
          .then(async () => {
            this.presets = await UserSettings.loadPresets();
          })
      return modal.present();
    },
    async removePreset(name: string, e: Event) {
      e.stopPropagation();
      const alert = await alertController
        .create({
          header: Locale.prompt.confirmation,
          message: Locale.formatString(Locale.prompt.delete,`"${name}"`) as string,
          buttons: [
            {
              text: Locale.actions.cancel,
              role: 'cancel'
            },
            {
              text: Locale.prompt.confirm,
              handler: () => {
                delete this.presets[name];
                UserSettings.savePresets(this.presets);
              },
            },
          ],
        });
      return alert.present();
    },
    async serverList() {
      const list = await UserSettings.loadServerList();
      const selected = UserSettings.state.selectedServer;

      const buttons: Array<Record<string,any>> = list.map((l,i) => {
        return {
          text: l.name,
          role: i==selected ? 'selected' : null,
          handler: () => {
            Emitter.emit("select-server", i);
          }
        }
      })
      buttons.push({
        text: Locale.actions.cancel,
        role: 'cancel'
      })

      const actionSheet = await actionSheetController
        .create({
          header: Locale.servers,
          buttons
        });
      return actionSheet.present();
    }
  },
});
</script>

<style scoped>
ion-content {
  text-align: initial;
}

p {
  margin-top: 16px;
  margin-bottom: 0px;
}

.autocomplete {
  overflow: visible;
  z-index: 100;
}

.info-val {
  font-size: var(--fs-body);
  color: var(--ink);
}

.info-block {
  font-size: var(--fs-body);
  color: var(--muted);
  overflow-wrap: anywhere;
}

.info-block.code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
}

.torrent {
  height:64px;
  border-bottom: 1px solid var(--rule);
  text-align:left;
}

.torrent > div {
  padding:5px;
  vertical-align: top;
}

.side {
  height:64px;
  width:50px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.side ion-icon {
  font-size:20px;
  margin: 18px 0px;
}

.middle {
  position:relative;
  display:inline-block;
  height:64px;
  width:calc(100% - 50px);
}

.name {
  font-size: var(--fs-body);
  font-weight: 500;
  line-height: 1.25rem;
  height: 38px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.details {
  font-size: var(--fs-small);
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.details ion-icon {
  vertical-align: -2px;
}
</style>