<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="#" @click="modalClose()"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ Locale.about.about }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding" ref="content">
      <div class="app-details">
        <img :src="iconSrc" alt="Logo">
        <h4>Transmissionic {{appVersion}}</h4>
        <p>Maintained fork.</p>
        <p>Copyright (c) 2021 Transmissionic<br>Copyright (c) 2026 lostinfuture</p>
      </div>

      <ion-list v-if="sessionArguments">
        <ion-list-header>
          <ion-label>{{ Locale.serverInformation }}</ion-label>
        </ion-list-header>
        <ion-item>
          <ion-label>{{ Locale.transmissionVersion }}</ion-label>
          <span slot="end" class="info-value tabular selectable">{{ sessionArguments.version || "—" }}</span>
        </ion-item>
        <ion-item>
          <ion-label>{{ Locale.freeSpace }}</ion-label>
          <span slot="end" class="info-value tabular selectable">{{ freeSpaceFormatted }}</span>
        </ion-item>
        <ion-item>
          <ion-label>{{ Locale.port }}</ion-label>
          <span slot="end" class="info-value tabular selectable">{{ sessionArguments["peer-port"] ?? "—" }}</span>
        </ion-item>
      </ion-list>

      <p>
        {{Locale.about.description}}
      </p>
      <p>
        {{formatText(Locale.about.github).before}}
        <a href="https://github.com/6c65726f79/Transmissionic" target="_blank" rel="noopener">https://github.com/6c65726f79/Transmissionic</a>
        {{formatText(Locale.about.github).after}}
      </p>
      <p>
        {{formatText(Locale.about.poeditor).before}}
        <a href="https://poeditor.com/join/project?hash=sbVnI9eo3d" target="_blank" rel="noopener">https://poeditor.com/join/project?hash=sbVnI9eo3d</a>
        {{formatText(Locale.about.poeditor).after}}
      </p>

      <p v-if="isWebUI">
        <ion-button size="default" @click="checkForUpdates()">{{ Locale.checkUpdates }}</ion-button>
      </p>

      <p v-if="updateAvailable && downloadUrl">
        <strong>{{formatText(Locale.updateAvailable).before}}</strong>
        <a :href="downloadUrl" target="_blank" rel="noopener">{{newVersion}}</a>
        <strong>{{formatText(Locale.updateAvailable).after}}</strong>
      </p>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  isPlatform,
  modalController,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonPage,
  IonBackButton,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { Locale } from "../services/Locale";
import { Utils } from "../services/Utils";
import { TransmissionRPC } from "../services/TransmissionRPC";

declare global {
  interface Window {
      updates: any;
  }
}

export default defineComponent({
  name: 'About',
  components: {
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonButtons,
    IonPage,
    IonBackButton,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel
  },
  data() {
    return {
      updateAvailable: false,
      newVersion: "",
      downloadUrl: "",
      sessionArguments: TransmissionRPC.sessionArguments ? { ...TransmissionRPC.sessionArguments } : null as Record<string, any> | null
    }
  },
  setup() {
    Utils.pushState();

    return {
      Locale,
      Utils,
      iconSrc: "./assets/icon/favicon.png" // Force Vue.js to load relative path without transformAssetUrls
    }
  },
  async mounted() {
    Utils.customScrollbar(this.$refs.content);
    if (TransmissionRPC.sessionArguments) {
      try {
        await TransmissionRPC.refreshFreeSpace();
        this.sessionArguments = { ...TransmissionRPC.sessionArguments };
      } catch (e) {
        this.sessionArguments = { ...TransmissionRPC.sessionArguments };
      }
    }
  },
  computed: {
    appVersion: function(): string {
      return `v${process.env.PACKAGE_VERSION||"1.0.0"}`;
    },
    isWebUI: function() {
      return !isPlatform("electron") && !isPlatform("capacitor")
    },
    freeSpaceFormatted(): string {
      if (!this.sessionArguments) return "—";
      const bytes = this.sessionArguments["download-dir-free-space"];
      return (Utils.formatBytes(bytes) as string) || "—";
    }
  },
  methods: {
    modalClose () {
      modalController.dismiss();
    },
    formatText(text: string) {
      const clean = Locale.formatString(text,"","") as string;
      const linkStart = text.indexOf("{0}");
      return {
        before:clean.substring(0,linkStart),
        after:clean.substring(linkStart)
      }
    },
    checkForUpdates() {
      fetch('https://api.github.com/repos/6c65726f79/Transmissionic/releases/latest')
        .then(async (response) => {
          Utils.responseToast("success");
          const result = await response.json()
          if(!result.prerelease){
            this.updateAvailable = this.isNewerVersion(this.appVersion,result.name)
            this.newVersion = result.name;
            this.downloadUrl = `https://github.com/6c65726f79/Transmissionic/releases/tag/${result.name}`;
          }
        })
    },
    isNewerVersion(current: string, latest: string) {
      if(current==latest) return false;
      const currentNums = current.substring(1).split('.');
      const latestNums = latest.substring(1).split('.');
      for (let i = 0; i < latestNums.length; i++) {
        const latestNum = parseInt(latestNums[i]);
        const currentNum = parseInt(currentNums[i]);
        if(!isNaN(latestNum) && !isNaN(currentNum)){
          if(latestNum>currentNum){
            return true;
          }
          else if(latestNum<currentNum){
            return false;
          }
        }
        else if(isNaN(currentNum)){
          return false;
        }
      }
      return false;
    }
  },
});
</script>

<style scoped>
h4 {
  margin-top: 0px;
}

.app-details {
  text-align: center;
  margin: 28px 0px 24px;
}

.app-details img {
  height: 60px;
  margin-bottom: 10px;
}

.info-value {
  font-size: var(--fs-body);
  color: var(--muted);
}
</style>
