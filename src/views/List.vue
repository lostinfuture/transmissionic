<template>
  <ion-page>

    <ion-header>
      <ion-toolbar v-if="connectionStatus.connected && privateState.selection.length>0" id="selection-toolbar" class="selection" color="primary">
        <ion-buttons slot="start">
          <ion-button fill="clear" @click="cancelSelection()" :aria-label="Locale.actions.cancel" :title="Locale.actions.cancel">
            <ion-icon slot="icon-only" :ios="closeOutline" :md="closeSharp"></ion-icon>
          </ion-button>
        </ion-buttons>
        <div class="text tabular" role="status">
          {{ privateState.selection.length }}
          {{ LocaleController.getPlural("selected",privateState.selection.length) }}
        </div>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="torrentActions(privateState.selection[0])" :aria-label="Locale.selection" :title="Locale.selection">
            <ion-icon slot="icon-only" :ios="ellipsisVerticalOutline" :md="ellipsisVerticalSharp"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <ion-toolbar v-else>
        <template v-if="!privateState.viewSearch">
          <ion-buttons slot="start">
            <ion-menu-button></ion-menu-button>
          </ion-buttons>
          <ion-title>
            <h1 class="screen-title" translate="no">{{ serverName || "Transmissionic" }}</h1>
          </ion-title>
          <ion-buttons slot="end" class="header-tools">
            <template v-if="connectionStatus.connected">
              <ion-button fill="clear" class="tool-btn" @click="resumeAll()" :aria-label="Locale.resumeAll" :title="Locale.resumeAll">
                <ion-icon slot="start" :ios="playOutline" :md="playSharp" aria-hidden="true"></ion-icon>
                <span class="tool-label">{{ Locale.resumeAll }}</span>
              </ion-button>
              <ion-button fill="clear" class="tool-btn" @click="stopAll()" :aria-label="Locale.stopAll" :title="Locale.stopAll">
                <ion-icon slot="start" :ios="pauseOutline" :md="pauseSharp" aria-hidden="true"></ion-icon>
                <span class="tool-label">{{ Locale.stopAll }}</span>
              </ion-button>
              <ion-button
                fill="clear"
                id="alt-speed"
                class="tool-btn"
                :class="{ on: altSpeedEnabled() }"
                @click="switchAltSpeed()"
                :aria-label="Locale.altSpeed"
                :title="Locale.altSpeed"
                :aria-pressed="altSpeedEnabled() ? 'true' : 'false'">
                <ion-icon
                  slot="start"
                  :ios="altSpeedEnabled() ? speedometer : speedometerOutline"
                  :md="speedometerSharp"
                  aria-hidden="true">
                </ion-icon>
                <span class="tool-label">{{ Locale.altSpeed }}</span>
              </ion-button>
              <button type="button" class="btn sort header-sort" :class="{ 'menu-expanded': sharedState.expandMenu }" @click="openOrderPopover" :aria-label="Locale.sort + ': ' + orderLabel">
                <ion-icon :ios="swapVerticalOutline" :md="swapVerticalSharp" aria-hidden="true"></ion-icon>
                <span class="sort-label">{{ orderLabel }}</span>
                <span aria-hidden="true">{{ sharedState.reverse ? "↓" : "↑" }}</span>
              </button>
            </template>
            <ion-button @click="toggleSearch()" fill="clear" class="tool-btn" :aria-label="Locale.search" :title="Locale.search">
              <ion-icon slot="start" :ios="searchOutline" :md="searchSharp" aria-hidden="true"></ion-icon>
            </ion-button>
            <ion-button
              v-if="connectionStatus.connected"
              class="add-button"
              fill="solid"
              color="primary"
              aria-haspopup="menu"
              @click="openAddMenu($event)">
              <ion-icon slot="start" :icon="add" aria-hidden="true"></ion-icon>
              {{ Locale.add }}
            </ion-button>
          </ion-buttons>
        </template>
        <template v-if="privateState.viewSearch">
          <ion-searchbar id="search" show-cancel-button="always" v-model="privateState.search" @ionCancel="toggleSearch()" :placeholder="Locale.search + '…'" :cancel-button-text="Locale.actions.cancel" :spellcheck="false" autocapitalize="off" inputmode="search"></ion-searchbar>
        </template>
      </ion-toolbar>

      <!-- The screen's answer on narrow screens when the menu drawer is closed -->
      <ion-toolbar v-if="connectionStatus.connected" class="summary" :class="{ 'menu-expanded': sharedState.expandMenu }">
        <div class="summary-row">
          <div class="figure down" :title="Locale.download">
            <span class="arrow" aria-hidden="true">↓</span>
            <span class="visually-hidden">{{ Locale.download }}</span>
            <span class="value tabular">{{ Utils.formatBytes(downloadSpeed(),1,true) }}</span>
          </div>
          <div class="figure up" :title="Locale.uploadSpeed">
            <span class="arrow" aria-hidden="true">↑</span>
            <span class="visually-hidden">{{ Locale.uploadSpeed }}</span>
            <span class="value tabular">{{ Utils.formatBytes(uploadSpeed(),1,true) }}</span>
          </div>
          <span v-if="altSpeedEnabled()" class="pill">{{ Locale.altSpeed }}</span>
          <button type="button" class="btn sort" @click="openOrderPopover" :aria-label="Locale.sort + ': ' + orderLabel">
            <ion-icon :ios="swapVerticalOutline" :md="swapVerticalSharp" aria-hidden="true"></ion-icon>
            <span class="sort-label">{{ orderLabel }}</span>
            <span aria-hidden="true">{{ sharedState.reverse ? "↓" : "↑" }}</span>
          </button>
        </div>
      </ion-toolbar>
    </ion-header>

    <ConnectionStatus
      v-if="!connectionStatus.connected"
      v-on:retry="retry()">
    </ConnectionStatus>

    <VirtualScroll v-else id="torrentList" :fullscreen="true" :items="torrentOrderedList" :item-size="itemSize" key-field="id">
      <template v-slot:start>
        <div id="top" class="list-head" :class="{ condensed: sharedState.compactMode }">
          <span class="lead-space" aria-hidden="true"></span>
          <span class="scope">
            <strong class="text-transform">{{ filterLabel }}</strong>
            <span class="tabular">{{ torrentSelectedList.length }} {{ LocaleController.getPlural("torrent",torrentSelectedList.length) }}</span>
            <span class="tabular">{{ Utils.formatBytes(totalSize,1) }}</span>
          </span>
          <span class="col-head">{{ Locale.size }}</span>
          <span class="col-head" :title="Locale.download"><span aria-hidden="true">↓</span><span class="visually-hidden">{{ Locale.download }}</span></span>
          <span class="col-head" :title="Locale.uploadSpeed"><span aria-hidden="true">↑</span><span class="visually-hidden">{{ Locale.uploadSpeed }}</span></span>
          <span class="col-head">{{ Locale.ratio }}</span>
        </div>
      </template>

      <template v-slot:default="{item}">
        <Torrent 
          :attr-id="item.id"
          :torrent="item"
          v-on:switch="switchTorrentState"
          @click="torrentClick(item)"
          @keydown.enter.self="torrentClick(item)"
          @contextmenu="longPress($event,item.id)" 
          v-longpress="longPressFallback"
          :class="{ 
            selected: privateState.selection.includes(item.id),
            removed: privateState.removed.includes(item.id)
          }">
        </Torrent>
      </template>

      <!-- Text to display if the list is empty -->
      <template v-slot:search v-if="privateState.search!=''">
        {{ Locale.noResult }}
      </template>

      <template v-slot:fab>
        <ion-fab vertical="bottom" horizontal="end" slot="fixed" class="add-fab">
          <ion-fab-button :aria-label="Locale.addTorrent">
            <ion-icon :icon="add" aria-hidden="true"></ion-icon>
          </ion-fab-button>
          <ion-fab-list side="top">
            <ion-fab-button color="light" :data-desc="Locale.torrentFile" :aria-label="Locale.torrentFile" @click="inputFile()">
              <ion-icon :ios="documentOutline" :md="documentSharp" aria-hidden="true"></ion-icon>
            </ion-fab-button>
            <ion-fab-button color="light" :data-desc="Locale.magnet" :aria-label="Locale.magnet" @click="inputMagnet()">
              <ion-icon :ios="magnetOutline" :md="magnetSharp" aria-hidden="true"></ion-icon>
            </ion-fab-button>
            <ion-fab-button color="light" data-desc="URL" aria-label="URL" @click="inputURL()">
              <ion-icon :ios="linkOutline" :md="linkSharp" aria-hidden="true"></ion-icon>
            </ion-fab-button>
          </ion-fab-list>
        </ion-fab>
      </template>
    </VirtualScroll>

    <!-- Wide-screen add menu, opened from the header button -->
    <ion-popover
      :is-open="privateState.addMenuOpen"
      :event="privateState.addMenuEvent"
      :dismiss-on-select="true"
      alignment="end"
      class="add-menu"
      @didDismiss="privateState.addMenuOpen=false">
      <ion-content>
        <ion-list lines="none">
          <ion-item button :detail="false" @click="inputFile()">
            <ion-icon slot="start" :ios="documentOutline" :md="documentSharp" aria-hidden="true"></ion-icon>
            <ion-label>{{ Locale.torrentFile }}</ion-label>
          </ion-item>
          <ion-item button :detail="false" @click="inputMagnet()">
            <ion-icon slot="start" :ios="magnetOutline" :md="magnetSharp" aria-hidden="true"></ion-icon>
            <ion-label>{{ Locale.magnet }}</ion-label>
          </ion-item>
          <ion-item button :detail="false" @click="inputURL()">
            <ion-icon slot="start" :ios="linkOutline" :md="linkSharp" aria-hidden="true"></ion-icon>
            <ion-label>URL</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-popover>

  </ion-page>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue';
import { 
  isPlatform,
  modalController,
  loadingController,
  popoverController,
  actionSheetController,
  alertController,
  IonButtons, 
  IonHeader, 
  IonMenuButton, 
  IonPage,
  IonTitle, 
  IonToolbar,
  IonIcon,
  IonButton,
  IonSearchbar,
  IonFab, 
  IonFabButton, 
  IonFabList,
  IonLabel,
  IonPopover,
  IonContent,
  IonList,
  IonItem
} from '@ionic/vue';
import {
  searchOutline,
  searchSharp,
  filterOutline,
  filterSharp,
  swapVerticalOutline,
  swapVerticalSharp,
  playOutline,
  playSharp,
  pauseOutline,
  pauseSharp,
  add,
  documentOutline,
  documentSharp,
  magnetOutline,
  magnetSharp,
  closeOutline,
  closeSharp,
  ellipsisVerticalOutline,
  ellipsisVerticalSharp,
  speedometer,
  speedometerOutline,
  speedometerSharp,
  arrowDownOutline,
  arrowUpOutline,
  linkOutline,
  linkSharp,
  pauseCircleOutline,
  pauseCircleSharp,
  playCircleOutline,
  playCircleSharp,
} from 'ionicons/icons';
import ConnectionStatus from './components/ConnectionStatus.vue';
import TorrentDetails from './TorrentDetails.vue'
import LocationAlert from './components/LocationAlert.vue';
import VirtualScroll from './components/VirtualScroll.vue'
import Torrent from './components/Torrent.vue'
import OrderPopover from './components/OrderPopover.vue'
import { TransmissionRPC } from "../services/TransmissionRPC";
import { UserSettings } from "../services/UserSettings";
import { FileHandler } from "../services/FileHandler";
import { LocaleController } from "../services/LocaleController";
import { Shortcuts } from '../services/Shortcuts';
import { Locale } from "../services/Locale";
import { Utils } from "../services/Utils";
import { Emitter } from "../services/Emitter";
import { iosEnterAnimation } from '@ionic/core/dist/collection/components/modal/animations/ios.enter.js';
import { iosLeaveAnimation } from '@ionic/core/dist/collection/components/modal/animations/ios.leave.js';
import { mdEnterAnimation } from '@ionic/core/dist/collection/components/modal/animations/md.enter.js';
import { mdLeaveAnimation } from '@ionic/core/dist/collection/components/modal/animations/md.leave.js';

import * as _ from 'lodash';

export default defineComponent({
  name: 'list',
  data() {
    return {
      torrentList:[] as Array<any>,
      filter:0,
      filterIds:[] as number[],
      connectionStatus: {} as Record<string,any>,
      serverName: "" as string,
      filterLabel: "" as string,
      sharedState: UserSettings.state,
      privateState: {
        viewSearch:false,
        search:"",
        viewPopover:false,
        needFallback:false,
        selection: [] as number[],
        removed: [] as number[],
        altSpeedEnabled:false,
        addMenuOpen:false,
        addMenuEvent:null as Event|null,
        liveDownloadSpeed:0,
        liveUploadSpeed:0
      }
    }
  },
  components: {
    ConnectionStatus,
    VirtualScroll,
    Torrent,
    IonButtons,
    IonHeader,
    IonMenuButton,
    IonPage,
    IonTitle,
    IonToolbar,
    IonIcon,
    IonButton,
    IonSearchbar,
    IonFab, 
    IonFabButton,
    IonFabList,
    IonLabel,
    IonPopover,
    IonContent,
    IonList,
    IonItem
  },
  computed: {
    torrentSelectedList: function(): Array<any> {
      let list = this.torrentList;
      const filter = this.filter;
      const removed = this.privateState.removed;
      const selection = this.privateState.selection;

      if(this.filterIds.length>0){
        list = _.filter(list, (o) => {
          return this.filterIds.includes(o.id)
        });
      }

      // Filter list by selected filter
      list = _.filter(list, function(o) {
        if(removed.includes(o.id)) return false; // Don't list removed torrents
        return filter==9 ? selection.includes(o.id) : Utils.getTorrentFilters(o).includes(filter)
      });

      // Filter list by search value
      if(this.privateState.search!=""){
        const search=this.privateState.search.toLowerCase();
        list = _.filter(list, function(o) {
          let include=false;
          if(UserSettings.state.searchByName){
            include=o.name.toLowerCase().replace(/\./g,' ').indexOf(search.replace(/\./g,' ')) >= 0;
          }
          if(UserSettings.state.searchByDirectory && !include){
            include=o.downloadDir.toLowerCase().indexOf(search) >= 0;
          }
          return include;
        });
      }

      return list
    },
    torrentOrderedList: function (): Array<any> {
      const orders = [this.sharedState.reverse ? 'desc' : 'asc'] as Array<any>;
      if(this.sharedState.orderBy=="name"){
        return _.orderBy(this.torrentSelectedList, [torrent => torrent.name.toString().toLowerCase()], orders);
      }
      else {
        return _.orderBy(this.torrentSelectedList, [this.sharedState.orderBy], orders);
      }
    },
    uploadSpeed: function (): any {
      const live = this.privateState.liveUploadSpeed;
      return () => TransmissionRPC.sessionStats ? TransmissionRPC.sessionStats.uploadSpeed : live;
    },
    downloadSpeed: function (): any {
      const live = this.privateState.liveDownloadSpeed;
      return () => TransmissionRPC.sessionStats ? TransmissionRPC.sessionStats.downloadSpeed : live;
    },
    itemSize() {
      // Keep in sync with the row heights in components/Torrent.vue
      return UserSettings.state.compactMode ? 44 : 68;
    },
    orderLabel(): string {
      const labels: Record<string,string> = {
        name: Locale.name,
        addedDate: Locale.addedDate,
        sizeWhenDone: Locale.size,
        uploadRatio: Locale.ratio,
        uploadedEver: Locale.uploaded,
        rateUpload: Locale.uploadSpeed,
        activityDate: Locale.lastActivity,
        queuePosition: Locale.queuePosition
      };
      return labels[this.sharedState.orderBy] || Locale.sort;
    },
    totalSize: function (): any {
      return this.torrentSelectedList.reduce(function(sum, current) {
        return sum + (current.percentDone * current.sizeWhenDone);
      }, 0);
    }
  },
  setup() {
    return { 
      Locale,
      LocaleController,
      Utils,
      searchOutline,
      searchSharp,
      filterOutline,
      filterSharp,
      swapVerticalOutline,
      swapVerticalSharp,
      playOutline,
      playSharp,
      pauseOutline,
      pauseSharp,
      add,
      documentOutline,
      documentSharp,
      magnetOutline,
      magnetSharp,
      closeOutline,
      closeSharp,
      ellipsisVerticalOutline,
      ellipsisVerticalSharp,
      speedometer,
      speedometerOutline,
      speedometerSharp,
      arrowDownOutline,
      arrowUpOutline,
      linkOutline,
      linkSharp,
      pauseCircleOutline,
      pauseCircleSharp,
      playCircleOutline,
      playCircleSharp,
    }
  },
  async created() {
    this.torrentList = inject('torrentList') as any;
    this.filter = inject('filter') as number;
    this.filterIds = inject('filterIds') as Array<number>;
    this.connectionStatus = inject('connectionStatus') as Record<string,any>;
    this.serverName = inject('serverName') as string;
    this.filterLabel = inject('filterLabel') as string;
  },
  mounted() {
    Emitter.on('switch', (id: any) => this.switchTorrentState(id) )
    Emitter.on('clear-selection', this.cancelSelection)
    Emitter.on('torrent-position', (data: any) => this.changeTorrentPosition(data.id,data.up));
    Emitter.on('add-torrent', this.inputFile);
    Emitter.on('add-magnet', this.inputMagnet);
    Emitter.on('add-url', this.inputURL);
    Emitter.on('select-all', this.selectAll);
    Emitter.on('toggle-search', this.toggleSearch);
    Emitter.on('session-stats', (payload: any) => {
      if(payload && payload.sessionStats){
        this.privateState.liveDownloadSpeed = payload.sessionStats.downloadSpeed || 0;
        this.privateState.liveUploadSpeed = payload.sessionStats.uploadSpeed || 0;
      }
    });
  },
  methods: {
    toggleSearch() {
      this.privateState.viewSearch = !this.privateState.viewSearch;
      if(this.privateState.viewSearch){
        setTimeout(() => {
          const search = document.querySelector("#search") as Record<string,any>;
          search?.setFocus();
        },100);
      }
      else {
        this.privateState.search="";
      }
    },
    retry() {
      Emitter.emit("refresh",true);
    },
    openAddMenu(ev: Event) {
      this.privateState.addMenuEvent = ev;
      this.privateState.addMenuOpen = true;
    },
    async openOrderPopover(ev: Event) {
      Emitter.emit("swipe-enabled",false);
      const popover = await popoverController
        .create({
          component: OrderPopover,
          event: ev,
          translucent: true,
          showBackdrop: isPlatform("ios")
        })
      popover.onDidDismiss().then(() => Emitter.emit("swipe-enabled",true));
      return popover.present();
    },
    async torrentClick(torrent: Record<string, any>) {
      if(this.privateState.selection.length>0 || Shortcuts.isPressed("Shift")) {
        this.selectTorrent(torrent.id);
      }
      else {
        const modal = await modalController
          .create({
            component: TorrentDetails,
            componentProps: {
              id:torrent.id,
              name:torrent.name
            }
          })
        modal.onDidDismiss()
          .then(() => {
            Emitter.emit("refresh", false);
            Emitter.emit("unmount-torrent-details");
          })
        return modal.present();
      }
    },
    switchTorrentState(torrentId: number){
      const torrent = this.getTorrentsByIds([torrentId])[0];
      if(torrent.status===0){
        this.torrentAction("start",[torrent.id])
      }
      else {
        this.torrentAction("stop",[torrent.id])
      }
    },
    altSpeedEnabled(): boolean {
      if(TransmissionRPC.sessionArguments){
        this.privateState.altSpeedEnabled = TransmissionRPC.sessionArguments['alt-speed-enabled'];
      }
      return this.privateState.altSpeedEnabled;
    },
    switchAltSpeed(){
      TransmissionRPC.setSession({"alt-speed-enabled":!this.altSpeedEnabled()})
        .then((response) => {
          Utils.responseToast(response.result)
          this.privateState.altSpeedEnabled=!this.privateState.altSpeedEnabled;
        })
    },
    torrentAction(action: string, torrentIds: Array<number>){
      TransmissionRPC.torrentAction(action,torrentIds)
        .then((response) => {
          Utils.responseToast(response.result)
          for (const torrent of this.getTorrentsByIds(torrentIds)) {
            torrent.status=Utils.actionStatusResult(action,torrent.status,torrent.percentDone);
          }
        })
        .catch((error) => {
          Utils.responseToast(error.message);
        })
    },
    stopAll(){
      this.torrentActionAll("stop");
    },
    resumeAll(){
      this.torrentActionAll("start");
    },
    torrentActionAll(action: string){
      TransmissionRPC.torrentActionAll(action)
        .then((response) => {
          Utils.responseToast(response.result)
          for (const torrent of this.torrentList) {
            torrent.status=Utils.actionStatusResult(action,torrent.status,torrent.percentDone);
          }
        })
        .catch((error) => {
          Utils.responseToast(error.message);
        })
    },
    getTorrentsByIds(torrentIds: Array<number>): Array<any>{
      return _.filter(this.torrentList, function (o) { return torrentIds.includes(o.id) })
    },
    selectTorrent(torrentId: number, remove=true){
      if(!this.privateState.selection.includes(torrentId)){
        this.privateState.selection.push(torrentId);
      }
      else if(remove) {
        this.privateState.selection.splice(this.privateState.selection.indexOf(torrentId),1);
      }
    },
    async selectAll() {
      const isModalOpened = await modalController.getTop();
      if(!isModalOpened){
        for(const torrent of this.torrentOrderedList){
          this.selectTorrent(torrent.id,false);
        }
      }
    },
    cancelSelection() {
      this.privateState.selection=[];
    },
    async removeTorrents(torrentIds: Array<number>){
      const selectedTorrents=this.getTorrentsByIds(torrentIds);
      const name=torrentIds.length==1 ? `"${selectedTorrents[0].name}"` : `${torrentIds.length} ${LocaleController.getForm("torrent","other")}`;

      const alert = await alertController
        .create({
          header: Locale.prompt.confirmation,
          message: Locale.formatString(Locale.prompt.remove,name) as string,
          inputs: [
            {
              name: 'deleteData',
              value: 'deleteData',
              label: Locale.prompt.deleteData,
              type: 'checkbox',
            },
          ],
          buttons: [
            {
              text: Locale.actions.cancel,
              role: 'cancel'
            },
            {
              text: Locale.prompt.confirm,
              handler: (data: Array<string>) => {
                TransmissionRPC.torrentAction("remove",torrentIds,{'delete-local-data':data.includes("deleteData")})
                  .then((response) => {
                    Utils.responseToast(response.result);
                    for (const torrent of selectedTorrents) {
                      this.privateState.removed.push(torrent.id);
                    }
                    this.cancelSelection();
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
    async torrentActions(id: number) {
      Utils.pushState();
      const torrent = this.getTorrentsByIds([id])[0];
      const selection = this.privateState.selection.length>0 ? this.privateState.selection : [torrent.id];

      let buttons = [
        {
          text: (this.privateState.selection.length==0) ? Locale.actions.select : Locale.actions.selectAll,
          handler: () => {
            if(this.privateState.selection.length==0){
              this.selectTorrent(torrent.id);
            }
            else {
              this.selectAll();
            }
          },
        },
        {
          text: Locale.actions.start,
          handler: () => this.torrentAction("start",selection)
        },
        {
          text: Locale.formatString(Locale.actions.startNow).toString(),
          handler: () => this.torrentAction("start-now",selection)
        },
        {
          text: Locale.actions.stop,
          handler: () => this.torrentAction("stop",selection)
        },
        {
          text: Locale.actions.reannounce,
          handler: () => this.torrentAction("reannounce",selection)
        },
        {
          text: Locale.actions.verify,
          handler: () => this.torrentAction("verify",selection)
        },
        {
          text: Locale.actions.setLocation,
          handler: () => this.setLocation(selection)
        },
        {
          text: Locale.actions.openInExplorer,
          handler: () => {
            TransmissionRPC.getTorrentDetails(torrent.id).then((details) => {
              const success = FileHandler.openExplorer(details);
              if(!success){
                Utils.responseToast(Locale.error.notFound);
              }
            });
          }
        },
        {
          text: Locale.actions.remove,
          role: 'destructive',
          handler: async ()  => {
            actionSheetController.dismiss();
            this.removeTorrents(selection)
          },
        },
        {
          text: Locale.actions.cancel,
          role: 'cancel'
        },
      ];

      if(!isPlatform("electron") || selection.length>1){
        buttons.splice(7, 1);
      }

      const actionSheet = await actionSheetController
        .create({
          header: (this.privateState.selection.length==0) ? torrent.name : Locale.selection,
          buttons
        });
      return actionSheet.present();
    },
    async setLocation(torrentIds: Array<number>) {
      const list = this.getTorrentsByIds(torrentIds);
      let downloadDir = list.every((val, i, arr) => val.downloadDir === arr[0].downloadDir) ? list[0].downloadDir : '';
      const modal = await modalController
        .create({
          component: LocationAlert,
          cssClass:"location-alert",
          enterAnimation:isPlatform("ios") ? iosEnterAnimation : mdEnterAnimation,
          leaveAnimation:isPlatform("ios") ? iosLeaveAnimation : mdLeaveAnimation,
          componentProps: {
            value:downloadDir,
          }
        })
      modal.onDidDismiss()
        .then((result) => {
          if(result.data){
            TransmissionRPC.torrentAction("set-location",torrentIds,result.data)
              .then(async (response) => {
                Utils.responseToast(response.result);
                list.forEach(t => t.downloadDir=result.data.location)
              })
              .catch((error) => {
                Utils.responseToast(error.message);
              })
          }
        })
      return modal.present();
    },
    changeTorrentPosition(id: number,up: boolean) {
      let pos = -1;
      let found = false;
      while(!found && pos < this.torrentOrderedList.length){
        pos++;
        if(this.torrentOrderedList[pos].id==id){
          found=true;
        }
      }
      const invertWith = up ?  pos-1 : pos+1;
      if(invertWith>=0 && invertWith<this.torrentOrderedList.length){
        const newPos = Math.round(this.torrentOrderedList[invertWith].queuePosition);
        TransmissionRPC.torrentAction("set",[id],{"queuePosition":newPos})
          .then((response) => {
            Utils.responseToast(response.result)
            const move = UserSettings.state.reverse ? -0.1 : 0.1;
            this.getTorrentsByIds([id])[0].queuePosition=up ? newPos-move : newPos+move;
          })
          .catch((error) => {
            Utils.responseToast(error.message);
          })
      }
    },
    longPress(e: Event, id: number) {
      if(e){
        e.preventDefault();
      }
      this.privateState.needFallback = false;
      this.torrentActions(id);
    },
    longPressFallback(id: number) {
      if(!id){ 
        // Init fallback
        this.privateState.needFallback = true;
      }
      else if(this.privateState.needFallback) {
        this.torrentActions(id)
      }
    },
    inputFile() {
      FileHandler.inputFile();
    },
    async inputMagnet() {
      const alert = await alertController
        .create({
          header: Locale.magnet,
          message: "BitTorrent info hash (BTIH)",
          inputs: [
            {
              type: 'textarea',
              name: 'link',
              placeholder: Locale.magnetLink
            }
          ],
          buttons: [
            {
              text: Locale.actions.cancel,
              role: 'cancel'
            },
            {
              text: Locale.ok,
              role: 'ok'
            },
          ],
        });
      const dismissed = alert.onDidDismiss();
      await alert.present();
      const detail = await dismissed;
      // Present the add modal only after the alert is gone.
      if(detail.role === 'ok'){
        const link = detail.data && detail.data.values ? detail.data.values.link : "";
        await FileHandler.readHashOrMagnet(link);
      }
    },
    async inputURL() {
      const alert = await alertController
        .create({
          header: "URL",
          inputs: [
            {
              name: 'url',
              type: 'textarea',
              placeholder: Locale.torrentFileLink
            }
          ],
          buttons: [
            {
              text: Locale.actions.cancel,
              role: 'cancel'
            },
            {
              text: Locale.ok,
              role: 'ok'
            },
          ],
        });
      const dismissed = alert.onDidDismiss();
      await alert.present();
      const detail = await dismissed;
      if(detail.role !== 'ok') return;
      const url = detail.data && detail.data.values ? detail.data.values.url : "";
      if(!url) return;
      const loading = await loadingController.create({});
      await loading.present();
      try {
        await FileHandler.readURL(url);
      } finally {
        await loading.dismiss();
      }
    }
  }
})
</script>

<style scoped>
/* Header
   ------------------------------------------- */

.screen-title {
  margin: 0;
  padding: 0;
  width: 100%;
  text-align: start;
  font-size: var(--fs-section);
  font-weight: 600;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-button {
  --padding-start: 12px;
  --padding-end: 14px;
  --background: var(--ink);
  --background-hover: var(--surface);
  --background-hover-opacity: 0.12;
  --background-focused: var(--surface);
  --background-focused-opacity: 0.12;
  --color: var(--surface);
  height: var(--control-height);
  margin-inline: 6px 0;
  font-size: var(--fs-body);
  display: none;
}

/* Summary: live transfer rates, the largest figures on the screen */
.summary {
  --min-height: 56px;
  --padding-start: max(16px, env(safe-area-inset-left));
  --padding-end: max(16px, env(safe-area-inset-right));
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
}

.figure {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  white-space: nowrap;
}

.figure .arrow {
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
}

.figure .value {
  font-size: 22px;
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.figure.down .arrow { color: var(--positive); }
.figure.up .arrow   { color: var(--info); }

.pill {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: var(--radius-control);
  background: var(--pill-warning-bg);
  color: var(--warning);
  font-size: var(--fs-small);
  font-weight: 500;
  white-space: nowrap;
}

.header-pill,
.header-sort {
  display: none;
}

.sort {
  margin-inline-start: auto;
  min-width: 0;
  max-width: 50%;
  padding: 0 10px;
  color: var(--muted);
}

.sort ion-icon {
  flex: 0 0 auto;
  font-size: 16px;
}

.sort-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ink);
}

/* List header: scope of the list, and column titles on wide screens.
   Uses the same grid as a torrent row so edges line up. */
.list-head {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  column-gap: 14px;
  align-items: center;
  min-height: 40px;
  padding: 0 max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left));
  border-bottom: 1px solid var(--line);
  font-size: var(--fs-small);
  color: var(--muted);
  text-align: start;
}

.list-head.condensed {
  column-gap: 12px;
}

.scope {
  display: flex;
  gap: 12px;
  min-width: 0;
  white-space: nowrap;
}

.scope strong {
  color: var(--ink);
  font-weight: 600;
}

.col-head {
  display: none;
}

#torrentList .removed {
  display:none;
}

/* Header tools
   ------------------------------------------- */

.header-tools .tool-btn {
  --color: var(--muted);
  --padding-start: 10px;
  --padding-end: 10px;
  font-size: var(--fs-body);
  height: var(--control-height);
  margin-inline: 0 2px;
}

.header-tools .tool-btn:hover {
  --color: var(--ink);
}

.header-tools .tool-btn ion-icon,
.header-tools .tool-btn ion-icon[slot="start"],
.header-tools .tool-btn ion-icon[slot="icon-only"] {
  margin-inline-end: 0;
  font-size: 16px !important;
  width: 16px !important;
  height: 16px !important;
}

.tool-label {
  display: none;
}

#alt-speed ion-icon {
  -webkit-transform: scaleX(-1);
  transform: scaleX(-1);
}

#alt-speed.on {
  --color: var(--warning);
  --background: var(--pill-warning-bg);
}

#selection-toolbar.selection .text {
  padding: 0 8px;
  font-weight: 500;
}

/* Floating add button (narrow screens) */
ion-fab-button[data-desc] {
  position: relative;
}

ion-fab-button[data-desc]::after {
  position: absolute;
  content: attr(data-desc);
  z-index: 1;
  right: 56px;
  bottom: 6px;
  background: var(--surface);
  border: 1px solid var(--line);
  padding: 6px 10px;
  border-radius: var(--radius-control);
  color: var(--ink);
  font-size: var(--fs-body);
  white-space: nowrap;
}

.add-menu {
  --width: 220px;
}

.add-menu ion-item {
  --min-height: 40px;
}

.add-menu ion-icon {
  font-size: 18px;
  color: var(--muted);
  margin-inline-end: 12px;
}

/* Wide screens
   ------------------------------------------- */

@media (min-width: 1100px) {
  .tool-label {
    display: inline;
    margin-inline-start: 6px;
  }

  .header-tools .tool-btn ion-icon[slot="start"] {
    margin-inline-end: 0;
  }
}

@media (min-width: 900px) {
  .add-button {
    display: inline-flex;
  }

  .add-fab {
    display: none;
  }

  .figure .value {
    font-size: var(--fs-lead);
  }

  .summary {
    --min-height: 64px;
  }

  .sort {
    max-width: 320px;
  }

  .list-head {
    grid-template-columns: 32px minmax(0, 1fr) 128px 96px 96px 56px;
  }

  .col-head {
    display: block;
    text-align: end;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

@media (min-width: 992px) {
  .summary.menu-expanded {
    display: none;
  }

  .header-pill.menu-expanded {
    display: inline-flex;
    margin-inline-end: 8px;
  }

  .header-sort.menu-expanded {
    display: inline-flex;
    margin-inline: 4px 6px;
    max-width: 240px;
  }
}
</style>