<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="#" @click="modalClose()"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ Locale.settings }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="saveSettings()" fill="clear">
            <ion-icon slot="icon-only" :ios="saveOutline" :md="saveSharp"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding" ref="content">
      <ion-list>
        <ion-list-header>
          <ion-label>
              {{ Locale.interface }}
          </ion-label>
        </ion-list-header>

        <ion-item>
          <ion-select :label="Locale.language" label-placement="start" placeholder="Select One" v-model="sharedState.language" :okText="Locale.ok" :cancelText="Locale.actions.cancel">
            <ion-select-option value="default">{{ Locale.default }}</ion-select-option>
            <ion-select-option value="cs">Čeština</ion-select-option>
            <ion-select-option value="de">Deutsch</ion-select-option>
            <ion-select-option value="de-at">Österreichisches Deutsch</ion-select-option>
            <ion-select-option value="el">ελληνικά</ion-select-option>
            <ion-select-option value="en">English</ion-select-option>
            <ion-select-option value="es-CL">Español chileno</ion-select-option>
            <ion-select-option value="es-CR">Español costarricense</ion-select-option>
            <ion-select-option value="fr">Français</ion-select-option>
            <ion-select-option value="fr-ch">Français de Suisse</ion-select-option>
            <ion-select-option value="hu">Magyar</ion-select-option>
            <ion-select-option value="it">Italiano</ion-select-option>
            <ion-select-option value="ko">한국어</ion-select-option>
            <ion-select-option value="nl">Nederlands</ion-select-option>
            <ion-select-option value="pl">Polskie</ion-select-option>
            <ion-select-option value="pt">Português</ion-select-option>
            <ion-select-option value="pt-br">Português Brasileiro</ion-select-option>
            <ion-select-option value="ru">Pусский</ion-select-option>
            <ion-select-option value="sk">Slovenčina</ion-select-option>
            <ion-select-option value="uk">Українська</ion-select-option>
            <ion-select-option value="zh-cn">简体中文</ion-select-option>
            <ion-select-option value="zh-tw">繁體中文</ion-select-option>
          </ion-select>
        </ion-item>
          
        <ion-item>
          <ion-select :label="Locale.theme" label-placement="start" placeholder="Select One" v-model="sharedState.colorScheme" :okText="Locale.ok" :cancelText="Locale.actions.cancel">
            <ion-select-option value="default">{{ Locale.default }}</ion-select-option>
            <ion-select-option value="light">{{ Locale.light }}</ion-select-option>
            <ion-select-option value="dark">{{ Locale.dark }}</ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-toggle v-model="sharedState.useBits" justify="space-between">{{ Locale.speedUnit }}</ion-toggle>
        </ion-item>
        
        <ion-item>
          <ion-toggle v-model="sharedState.compactMode" justify="space-between">{{ Locale.compactMode }}</ion-toggle>
        </ion-item>

        <ion-item>
          <ion-toggle v-model="sharedState.expandMenu" justify="space-between">{{ Locale.expandSideMenu }}</ion-toggle>
        </ion-item>

        <ion-item>
          <ion-toggle v-model="sharedState.showTrackerList" justify="space-between">{{ Locale.showTrackerList }}</ion-toggle>
        </ion-item>
        
        <ion-item>
          <ion-toggle v-model="sharedState.ipFlags" justify="space-between">{{ Locale.displayFlag }}*</ion-toggle>
        </ion-item>
        <div class="annotation">
          * {{ Locale.formatString(Locale.useIpApi,'country.is') }} <a href="http://country.is/" target="_blank" rel="noopener"><ion-icon slot="icon-only" :ios="informationCircleOutline" :md="informationCircleSharp"></ion-icon></a>
        </div>
      </ion-list>

      <ion-list>
        <ion-list-header>
          <ion-label>
              {{ Locale.connection }}
          </ion-label>
        </ion-list-header>

        <ion-item>
          <ion-input :label="Locale.refreshInterval" label-placement="stacked" type="number" v-model.number="sharedState.refreshInterval"></ion-input>
        </ion-item>
        <ion-item>
          <ion-input :label="Locale.connectionTimeout" label-placement="stacked" type="number" v-model.number="sharedState.timeout"></ion-input>
        </ion-item>
      </ion-list>

      <ion-list>
        <ion-list-header>
          <ion-label>
              {{ Locale.searchBy }}
          </ion-label>
        </ion-list-header>
        
        <ion-item>
          <ion-checkbox justify="start" label-placement="end" v-model="sharedState.searchByName">{{ Locale.name }}</ion-checkbox>
        </ion-item>

        <ion-item>
          <ion-checkbox justify="start" label-placement="end" v-model="sharedState.searchByDirectory">{{ Locale.downloadDir }}</ion-checkbox>
        </ion-item>
      </ion-list>

      <ion-list>
        <ion-list-header>
          <ion-label>
              {{ Locale.preset }}
          </ion-label>
        </ion-list-header>
        
        <ion-item>
          <ion-toggle v-model="sharedState.rememberSelectedPreset" justify="space-between">{{ Locale.rememberSelectedPreset }}</ion-toggle>
        </ion-item>
        
        <div class="ion-padding small">
          <ion-button size="default" @click="exportPreset">{{ Locale.export }}</ion-button>
          <ion-button size="default" @click="inputPreset">{{ Locale.import }}</ion-button>
          <input type="file" id="importPreset" accept=".json" @change="importPreset"/>
        </div>
      </ion-list>

      <ion-list v-if="protocolHandlerAvailable">
        <ion-list-header>
          <ion-label>
              {{ Locale.protocols }}
          </ion-label>
        </ion-list-header>
        
        <ion-item>
          <ion-toggle v-model="sharedState.openMagnetLinks" justify="space-between">{{ Locale.openMagnetLinks }}</ion-toggle>
        </ion-item>
      </ion-list>

      <ion-list v-if="bookmarkletEnabled">
        <ion-list-header>
          <ion-label>
            {{ Locale.bookmarklet }}
          </ion-label>
        </ion-list-header>

        <ion-item>
          {{ Locale.bookmarkletDetail }}
        </ion-item>

        <div class="ion-padding small">
          <a :href="bookmarkletScript"><ion-button size="default">Download with Transmissionic</ion-button></a>
        </div>
      </ion-list>

      <ion-list>
        <ion-list-header>
          <ion-label>
            {{ Locale.reset }}
          </ion-label>
        </ion-list-header>

        <div class="ion-padding small">
          <ion-button size="default" @click="resetSettings()">{{ Locale.resetSettings }}</ion-button>
        </div>
      </ion-list>
    </ion-content>
    
  </ion-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { 
  modalController,
  alertController,
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonList,
  IonItem, 
  IonLabel,
  IonListHeader,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonButtons,
  IonButton,
  IonPage,
  IonInput,
  IonBackButton,
  IonToggle,
  isPlatform,
  IonCheckbox
} from '@ionic/vue';
import {
  saveOutline,
  saveSharp,
  informationCircleOutline,
  informationCircleSharp
} from 'ionicons/icons';
import { Utils } from "../services/Utils";
import { Locale } from "../services/Locale";
import { UserSettings } from "../services/UserSettings";
import { FileHandler } from '../services/FileHandler';

declare global {
  interface Window {
    magnetProtocol: any;
  }
}

const bookmarkletFunction = (href: string) => {
  let found=0;
  let selection=(getSelection()||"").toString();
  const hashRegex = /^[0-9a-fA-F]{40}$/;
  const magnetRegex = /^magnet:\?xt=urn:btih:[0-9a-zA-Z]{32,}(&.+)?$/;
  if(selection.match(hashRegex)||selection.match(magnetRegex)){
    found=4;
  }
  else {
    document.querySelectorAll('a').forEach((link)=> {
      if(found<1 && link.href.match(/\/(torrent|download|get|dl)\W/)){
        selection="url:"+link.href;
        found=1;
      }
      else if(found<2 && link.href.match(/\.torrent$/)){
        selection="url:"+link.href;
        found=2;
      }
      else if(found<3 && link.href.match(magnetRegex)){
        selection=link.href;
        found=3;
      }
    });
  }
  if (found) {
    window.open(href+"#"+encodeURIComponent(selection));
  } else {
    alert("No torrent or magnet link found.");
  }
}

export default defineComponent({
  name: 'Settings',
  data() {
    return {
      sharedState: UserSettings.state,
      privateState: {}
    }
  },
  components: { 
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonList,
    IonItem, 
    IonLabel,
    IonListHeader,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonButtons,
    IonButton,
    IonPage,
    IonInput,
    IonBackButton,
    IonToggle,
    IonCheckbox
  },
  computed: {
    bookmarkletEnabled(): boolean {
      return !isPlatform("electron") && !isPlatform("capacitor")
    },
    protocolHandlerAvailable(): boolean {
      return !isPlatform("electron") && !isPlatform("capacitor") && navigator.registerProtocolHandler!==undefined
    }
  },
  setup() {
    Utils.pushState();
    const href = window.location.href.replace(window.location.hash,"");
    const bookmarkletScript = `javascript:(${bookmarkletFunction})("${href}");`;

    return { 
      Locale,
      bookmarkletScript,
      saveOutline,
      saveSharp,
      informationCircleOutline,
      informationCircleSharp
    }
  },
  mounted() {
    Utils.customScrollbar(this.$refs.content);
  },
  methods: {
    saveSettings () {
      UserSettings.saveSettings();
      Utils.responseToast("success");
      Utils.registerMagnetLinkProtocol();
    },
    modalClose () {
      modalController.dismiss();
    },
    async resetSettings(){
      const alert = await alertController
        .create({
          header: Locale.prompt.confirmation,
          message: Locale.prompt.reset,
          buttons: [
            {
              text: Locale.actions.cancel,
              role: 'cancel'
            },
            {
              text: Locale.prompt.confirm,
              handler: () => {
                UserSettings.resetSettings();
              },
            },
          ],
        });
      return alert.present();
    },
    exportPreset() {
      UserSettings.loadPresets()
        .then(presets => {
          Utils.downloadFile(JSON.stringify(presets), 'preset.json', 'application/json');
        });
    },
    inputPreset() {
      document.getElementById('importPreset')?.click();
    },
    async importPreset(e: Event) {
      const files = (e.target as HTMLInputElement).files;
      if(files){
        let json: Record<string,any>;
        const content = Buffer.from(await FileHandler.readFile(files[0])).toString();
        try {
          json = JSON.parse(content);
        } catch (e) {json={}}

        if(this.validatePreset(json)){
          UserSettings.savePresets(json);
          Utils.responseToast("success");
        }
        else {
          Utils.responseToast("Invalid preset file");
        }
      }
    },
    validatePreset(preset: Record<string,any>) {
      let valid=false;
      const keys = Object.keys(preset)
      if(keys.length>0){
        const properties = Object.keys(preset[keys[0]]);
        if(properties.includes('start') && properties.includes('downloadDir') && properties.includes('bandwidthPriority') && properties.includes('other')){
          valid=true;
        }
      }
      return valid;
    }
  },
});
</script>

<style scoped>
.content {
  padding-top:var(--offset-top);
}

.annotation {
  padding: 10px 16px 0px 16px;
  color:var(--ion-color-medium);
}
.annotation a {
  color:inherit;
}
.annotation ion-icon {
  vertical-align: middle;
}

#importPreset {
  display:none;
}
</style>
