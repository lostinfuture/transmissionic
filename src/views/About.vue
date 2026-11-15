<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="#" text="" @click="modalClose()"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ Locale.about.about }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding" ref="content">
      <div class="app-details">
        <img :src="iconSrc" alt="Logo">
        <h4>Transmissionic {{appVersion}}</h4>
        <p class="subtitle">Maintained fork of <a href="https://github.com/6c65726f79/Transmissionic" target="_blank" rel="noopener">6c65726f79/Transmissionic</a></p>
        <p class="copyright">Copyright (c) 2021 Transmissionic<br>Copyright (c) 2026 lostinfuture</p>
      </div>

      <ion-list>
        <ion-list-header>
          <ion-label>{{ Locale.about.about }}</ion-label>
        </ion-list-header>
        <ion-item>
          <div class="about-prose">
            <p>
              Transmissionic is a static web interface for <code>transmission-daemon</code> built with Vue 3 and Ionic. Maintained fork.
            </p>
            <p>
              This fork strips out the legacy mobile and desktop wrappers to focus on the browser UI. It adds Transmission 4.1+ JSON-RPC 2.0 support with automatic fallback to the legacy RPC format, works over plain HTTP on a local network without <code>crypto.subtle</code>, and resolves same-origin RPC paths automatically behind reverse proxies.
            </p>
            <p>
              The interface has been rebuilt with a neutral dark and light palette, a live transfer rate graph and session statistics in the sidebar, unified client and server settings, top-bar batch controls, and responsive layout fixes for desktop and Mobile Safari.
            </p>
            <p>
              Source code and releases:
              <a href="https://github.com/lostinfuture/transmissionic" target="_blank" rel="noopener">github.com/lostinfuture/transmissionic</a>
            </p>
          </div>
        </ion-item>
        <div class="ion-padding small" v-if="isWebUI">
          <ion-button size="default" @click="checkForUpdates()">{{ Locale.checkUpdates }}</ion-button>
          <span v-if="updateAvailable && downloadUrl" class="update-note">
            <strong>{{formatText(Locale.updateAvailable).before}}</strong>
            <a :href="downloadUrl" target="_blank" rel="noopener">{{newVersion}}</a>
            <strong>{{formatText(Locale.updateAvailable).after}}</strong>
          </span>
        </div>
      </ion-list>
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
      downloadUrl: ""
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
  mounted() {
    Utils.customScrollbar(this.$refs.content);
  },
  computed: {
    appVersion: function(): string {
      return `v${process.env.PACKAGE_VERSION||"1.0.0"}`;
    },
    isWebUI: function() {
      return !isPlatform("electron") && !isPlatform("capacitor")
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
      fetch('https://api.github.com/repos/lostinfuture/transmissionic/releases/latest')
        .then(async (response) => {
          Utils.responseToast("success");
          const result = await response.json()
          const tag = result.tag_name || result.name;
          if(!result.prerelease && tag){
            this.updateAvailable = this.isNewerVersion(this.appVersion, tag)
            this.newVersion = tag;
            this.downloadUrl = `https://github.com/lostinfuture/transmissionic/releases/tag/${tag}`;
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

.subtitle {
  margin: 4px 0;
  color: var(--muted);
}

.copyright {
  margin: 4px 0 0;
  font-size: var(--fs-small);
  color: var(--muted);
}

.about-prose {
  padding: 14px 0;
  font-size: var(--fs-body);
  line-height: 1.65;
  color: var(--ink);
}

.about-prose p {
  margin: 0 0 12px;
}

.about-prose p:last-child {
  margin-bottom: 0;
}

.about-prose code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.92em;
}

.update-note {
  font-size: var(--fs-body);
}
</style>
