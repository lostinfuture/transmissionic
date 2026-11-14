<template>
  <ion-content>
    <div class="placeholder" role="status" aria-live="polite">
      <template v-if="connectionStatus.error!=''">
        <h2>{{ Utils.localizeError(connectionStatus.error) }}</h2>
        <div class="actions">
          <button type="button" class="btn" @click="$emit('retry')">{{ Locale.retry }}</button>
        </div>
      </template>
      <template v-else-if="connectionStatus.loading">
        <ion-spinner name="crescent" :aria-label="Locale.updating"></ion-spinner>
      </template>
      <template v-else-if="serverCount==0">
        <h2 translate="no">Transmissionic</h2>
        <p>{{ Locale.about.shortDescription }}</p>
        <div class="actions">
          <button type="button" class="btn primary" @click="addServer()">{{ Locale.newServer }}</button>
        </div>
      </template>
    </div>
  </ion-content>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue';
import { 
  IonContent,
  IonSpinner
} from '@ionic/vue';
import { Locale } from "../../services/Locale";
import { Emitter } from "../../services/Emitter";
import { Utils } from '../../services/Utils';

export default defineComponent({
  name: 'ConnectionStatus',
  components: { 
    IonContent,
    IonSpinner
  },
  setup() {
    const connectionStatus = inject('connectionStatus') as Record<string, any>;
    const serverCount = inject('serverCount') as any;
    return { 
      connectionStatus,
      serverCount,
      Locale,
      Utils
    }
  },
  methods: {
    addServer() {
      Emitter.emit('add-server')
    },
    addServerText() {
      const text = Locale.formatString(Locale.startByAddingServer,"","") as string;
      const linkStart = Locale.startByAddingServer.indexOf("{0}");
      let linkEnd = Locale.startByAddingServer.replace("{0}","").indexOf("{1}");
      if(linkEnd<0){
        linkEnd=Locale.startByAddingServer.length;
      }
      return {
        before:text.substring(0,linkStart),
        link:text.substring(linkStart,linkEnd),
        after:text.substring(linkEnd)
      }
    }
  }
});
</script>