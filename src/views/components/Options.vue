<template>
  <ion-content class="ion-padding" ref="content">
    <ion-list>
      <ion-list-header>
        <ion-label>{{ Locale.bandwidth }}</ion-label>
      </ion-list-header>
      <ion-item>
        <ion-label>{{ Locale.downloadLimit + ' (' + speedUnit + ')' }}</ion-label>
        <div class="row-controls swiper-no-swiping" slot="end">
          <ion-input class="compact-input" :aria-label="Locale.downloadLimit" v-model.number="details.downloadLimit" type="number" :disabled="!details.downloadLimited"></ion-input>
          <ion-toggle v-model="details.downloadLimited" :aria-label="Locale.downloadLimit" class="swiper-no-swiping"></ion-toggle>
        </div>
      </ion-item>
      <ion-item>
        <ion-label>{{ Locale.uploadLimit + ' (' + speedUnit + ')' }}</ion-label>
        <div class="row-controls swiper-no-swiping" slot="end">
          <ion-input class="compact-input" :aria-label="Locale.uploadLimit" v-model.number="details.uploadLimit" type="number" :disabled="!details.uploadLimited"></ion-input>
          <ion-toggle v-model="details.uploadLimited" :aria-label="Locale.uploadLimit" class="swiper-no-swiping"></ion-toggle>
        </div>
      </ion-item>
      <ion-item>
        <ion-label>{{ Locale.peersLimit }}</ion-label>
        <div class="row-controls swiper-no-swiping" slot="end">
          <ion-input class="compact-input" :aria-label="Locale.peersLimit" v-model.number="details['peer-limit']" type="number"></ion-input>
        </div>
      </ion-item>
      <ion-item>
        <ion-select :label="Locale.priority.priority" label-placement="start" justify="space-between" placeholder="Select One" v-model="details.bandwidthPriority" :okText="Locale.ok" :cancelText="Locale.actions.cancel">
          <ion-select-option :value="1">{{ Locale.priority.high }}</ion-select-option>
          <ion-select-option :value="0">{{ Locale.priority.normal }}</ion-select-option>
          <ion-select-option :value="-1">{{ Locale.priority.low }}</ion-select-option>
        </ion-select>
      </ion-item>
    </ion-list>

    <ion-list>
      <ion-list-header>
        <ion-label>{{ Locale.ratio }}</ion-label>
      </ion-list-header>
      <ion-item>
        <!-- seedRatioMode : 0 = global settings, 1 = yes, 2 = no -->
        <ion-label>
          {{ Locale.useGlobalLimit }}
        </ion-label>
        <TriToggle
          :label="Locale.useGlobalLimit"
          :value="details.seedRatioMode"
          :true="0"
          v-on:update="details.seedRatioMode=$event.checked ? 0 : 2"
          slot="end"
        ></TriToggle>
      </ion-item>
      <ion-item :disabled="details.seedRatioMode==0">
        <ion-label>{{ Locale.seedRatioLimit }}</ion-label>
        <div class="row-controls swiper-no-swiping" slot="end">
          <ion-input class="compact-input" :aria-label="Locale.seedRatioLimit" v-model.number="details.seedRatioLimit" type="number" :disabled="details.seedRatioMode==2"></ion-input>
          <TriToggle
            :label="Locale.seedRatioLimit"
            :value="details.seedRatioMode"
            :true="1"
            :false="2"
            v-on:update="details.seedRatioMode=$event.checked ? 1 : $event.value"
          ></TriToggle>
        </div>
      </ion-item>
    </ion-list>

    <ion-list>
      <ion-list-header>
        <ion-label>{{ Locale.inactivity }}</ion-label>
      </ion-list-header>
      <ion-item>
        <!-- seedIdleMode : 0 = global settings, 1 = yes, 2 = no -->
        <ion-label>
          {{ Locale.useGlobalLimit }}
        </ion-label>
        <TriToggle
          :label="Locale.useGlobalLimit"
          :value="details.seedIdleMode"
          :true="0"
          v-on:update="details.seedIdleMode=$event.checked ? 0 : 2"
          slot="end"
        ></TriToggle>
      </ion-item>
      <ion-item :disabled="details.seedIdleMode==0">
        <ion-label>{{ Locale.stopWhenInactive }}</ion-label>
        <div class="row-controls swiper-no-swiping" slot="end">
          <ion-input class="compact-input" :aria-label="Locale.stopWhenInactive" v-model.number="details.seedIdleLimit" type="number" :disabled="details.seedIdleMode==2"></ion-input>
          <TriToggle
            :label="Locale.stopWhenInactive"
            :value="details.seedIdleMode"
            :true="1"
            :false="2"
            v-on:update="details.seedIdleMode=$event.checked ? 1 : $event.value"
          ></TriToggle>
        </div>
      </ion-item>

    </ion-list>
  </ion-content>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue';
import { 
  IonContent,
  IonList,
  IonItem,
  IonListHeader,
  IonLabel,
  IonInput,
  IonToggle,
  IonSelect,
  IonSelectOption,
} from '@ionic/vue';
import TriToggle from './TriToggle.vue'
import { Locale } from "../../services/Locale";
import { Utils } from "../../services/Utils";
import { UserSettings } from "../../services/UserSettings";

export default defineComponent({
  components: {
    TriToggle,
    IonContent,
    IonList,
    IonItem,
    IonListHeader,
    IonLabel,
    IonInput,
    IonToggle,
    IonSelect,
    IonSelectOption,
  },
  data() {
    return {
      details:{} as Record<string,any>
    }
  },
  setup() {
    return { 
      Utils,
      Locale
    }
  },
  created() {
    this.details = inject('newOptions') as Record<string,any>;
  },
  mounted() {
    Utils.customScrollbar(this.$refs.content)
  },
  computed: {
    speedUnit:() => {
      return 'K' + (UserSettings.state.useBits ? Locale.units.bit : Locale.units.byte) + Locale.units.perSecond
    }
  }
})
</script>

<style scoped>
ion-content {
  text-align: initial;
}
</style>