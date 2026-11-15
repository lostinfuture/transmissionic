<template>
  <ion-content :fullscreen="fullscreen" :class="{ 'framed-content': !fullscreen }" ref="virtualscroll">
    <slot name="fab"></slot>

    <div :class="{ 'scroller-frame': !fullscreen }">
      <RecycleScroller
        :class="{ scroller: true, bottom }"
        ref="scroller"
        :items="items"
        :item-size="itemSize"
        :key-field="keyField ? keyField : null"
      >
        <template v-slot:before>
          <slot name="start"></slot>

          <div class="placeholder" v-if="items.length==0">
            <strong class="capitalize">{{ Locale.empty }}</strong>
            <p><slot name="search"></slot></p>
          </div>
        </template>

        <template v-slot:default="{item}">
          <slot :item="item"></slot>
        </template>
      </RecycleScroller>
      
      <slot name="end"></slot>
    </div>
  </ion-content>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { 
  IonContent, 
} from '@ionic/vue';
import { Locale } from "../../services/Locale";
import { Utils } from "../../services/Utils";

import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

export default defineComponent({
  props: ['items','itemSize',"keyField","fullscreen","bottom"],
  data() {
    return {
      scrollIndex:0,
      lastScrollTop:0
    }
  },
  components: {
    IonContent,
  },
  setup() {
    return {
      Locale
    }
  },
  mounted() {
    const scroller = this.$refs.scroller as any;

    Utils.customScrollbar(scroller, true, false);

    scroller.$el.addEventListener("scroll", () => this.handleScroll(scroller), false);
  },
  methods: {
    handleScroll (element: Record<string,any>) {
      const container = this.$refs.virtualscroll as Record<string,any>;
      const st = element.$el.scrollTop;
      container.$el.classList.toggle("no-fab", (st > this.lastScrollTop));
      this.lastScrollTop = st <= 0 ? 0 : st;
    }
  }
})
</script>

<style scoped>
ion-content.framed-content {
  --background: var(--ground);
}

.scroller-frame {
  box-sizing: border-box;
  height: calc(100% - 32px);
  margin: 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-panel);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.scroller {
  height: 100%;
}

.scroller-frame .scroller {
  flex: 1 1 0;
  min-height: 0;
  height: auto;
}

.scroller.bottom:not(.scroller-frame .scroller) {
  height: calc(100% - 50px);
}

.placeholder {
  position: absolute;
  width:100%;
  top: 50%;
  transform: translateY(-50%);
  text-align:center;
  pointer-events: none;
}

.placeholder .capitalize {
  display: inline-block;
}

.placeholder .capitalize::first-letter {
  text-transform: uppercase;
}
</style>