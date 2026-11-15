<template>
  <ion-page>
    <ion-header :translucent="true">
        <ion-toolbar>
            <ion-buttons slot="start">
            <ion-back-button defaultHref="#" text="" @click="modalClose()"></ion-back-button>
            </ion-buttons>
            <ion-title>{{ Locale.preset }}</ion-title>
            <ion-buttons slot="end">
            <ion-button @click="add()" fill="clear">
                <ion-icon slot="icon-only" :ios="checkmarkOutline" :md="checkmarkSharp"></ion-icon>
            </ion-button>
            </ion-buttons>
        </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="ion-padding" ref="content">
      
        <ion-list>
            <ion-list-header>
              <ion-label>
                {{ Locale.options }}
              </ion-label>
            </ion-list-header>

            <ion-item>
              <div class="stacked-field">
                <span class="field-label">{{ Locale.name }}</span>
                <ion-input :aria-label="Locale.name" v-model="name"></ion-input>
              </div>
            </ion-item>

            <ion-item class="autocomplete" v-if="connectionStatus.connected">
              <div class="stacked-field">
                <span class="field-label">{{ Locale.downloadDir }}</span>
                <autocomplete 
                  :aria-label="Locale.downloadDir"
                  :items="TransmissionRPC.persistentData.downloadDir"
                  :placeholder="defaultDownloadDir"
                  v-on:update="setDownloadDir">
                </autocomplete>
              </div>
            </ion-item>

            <ion-item>
              <ion-toggle v-model="settings.start" justify="space-between">{{ Locale.actions.start }}</ion-toggle>
            </ion-item>
        </ion-list>

        <ion-list>
            <ion-list-header>
                <ion-label>{{ Locale.bandwidth }}</ion-label>
            </ion-list-header>

            <ion-item>
            <ion-select :label="Locale.priority.priority" label-placement="start" justify="space-between" placeholder="Select One" v-model="settings.bandwidthPriority" :okText="Locale.ok" :cancelText="Locale.actions.cancel">
                <ion-select-option :value="1">{{ Locale.priority.high }}</ion-select-option>
                <ion-select-option :value="0">{{ Locale.priority.normal }}</ion-select-option>
                <ion-select-option :value="-1">{{ Locale.priority.low }}</ion-select-option>
            </ion-select>
            </ion-item>

            <ion-item>
                <ion-label>{{ Locale.downloadLimit + ' (' + speedUnit + ')' }}</ion-label>
                <div class="row-controls" slot="end">
                  <ion-input class="compact-input" :aria-label="Locale.downloadLimit" v-model.number="settings.other.downloadLimit" type="number" :disabled="!settings.other.downloadLimited"></ion-input>
                  <ion-toggle v-model="settings.other.downloadLimited" :aria-label="Locale.downloadLimit"></ion-toggle>
                </div>
            </ion-item>

            <ion-item>
                <ion-label>{{ Locale.uploadLimit + ' (' + speedUnit + ')' }}</ion-label>
                <div class="row-controls" slot="end">
                  <ion-input class="compact-input" :aria-label="Locale.uploadLimit" v-model.number="settings.other.uploadLimit" type="number" :disabled="!settings.other.uploadLimited"></ion-input>
                  <ion-toggle v-model="settings.other.uploadLimited" :aria-label="Locale.uploadLimit"></ion-toggle>
                </div>
            </ion-item>
        </ion-list>

    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { 
  modalController,
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonButton,
  IonButtons,
  IonPage,
  IonBackButton,
  IonIcon,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonInput
} from '@ionic/vue';
import {
  checkmarkOutline,
  checkmarkSharp
} from 'ionicons/icons';
import { defineComponent, inject } from 'vue';
import Autocomplete from './components/Autocomplete.vue';
import { TransmissionRPC } from "../services/TransmissionRPC";
import { UserSettings } from '../services/UserSettings';
import { Locale } from "../services/Locale";
import { Utils } from "../services/Utils";

export default defineComponent({
    name: 'Preset',
    components: { 
        Autocomplete,
        IonContent, 
        IonHeader, 
        IonTitle, 
        IonToolbar,
        IonButton,
        IonButtons,
        IonPage,
        IonBackButton,
        IonIcon,
        IonList,
        IonListHeader,
        IonItem,
        IonLabel,
        IonToggle,
        IonSelect,
        IonSelectOption,
        IonInput
    },
    data() {
        return {
            defaultDownloadDir:"",
            name:"",
            settings:{
                start:true,
                downloadDir:"",
                bandwidthPriority:0,
                other:{
                    downloadLimited:false,
                    uploadLimited:false,
                    downloadLimit:0,
                    uploadLimit:0,
                }
                
            }
        }
    },
    setup() {
        Utils.pushState();
        const connectionStatus = inject('connectionStatus') as Record<string, any>;

        return { 
            connectionStatus,
            Locale,
            TransmissionRPC,
            checkmarkOutline,
            checkmarkSharp
        }
    },
    async created() {
        this.defaultDownloadDir = await TransmissionRPC.getSessionArgument('download-dir')
    },
    mounted() {
        Utils.customScrollbar(this.$refs.content);
    },
    computed: {
        speedUnit:() => {
            return 'K' + (UserSettings.state.useBits ? Locale.units.bit : Locale.units.byte) + Locale.units.perSecond
        }
    },
    methods: {
        modalClose () {
            modalController.dismiss();
        },
        setDownloadDir(directory: string) {
            this.settings.downloadDir=directory;
        },
        async add() {
            if(this.name!=""){
                if(UserSettings.state.useBits){
                    // Bits to bytes
                    this.settings.other.downloadLimit = Math.round(this.settings.other.downloadLimit/8);
                    this.settings.other.uploadLimit = Math.round(this.settings.other.uploadLimit/8);
                }

                const presets = await UserSettings.loadPresets();
                presets[this.name]=this.settings;
                UserSettings.savePresets(presets);
                Utils.responseToast("success");
                this.modalClose();
            }
        }
    },
});
</script>

<style scoped>
p {
  margin-top: 16px;
  margin-bottom: 0px;
}

.autocomplete {
    overflow: visible;
    z-index: 100;
}

.left {
    position: absolute;
    bottom: 0px;
}
</style>