import { reactive } from 'vue';
import { Emitter } from './Emitter';

export default class TabController {
  state = reactive({
    selectedTab: 0,
    visibleTab: 0,
    segments: {} as Record<string, any>
  });

  listenersOff = false;

  onNext = (): void => {
    this.setTab(Number(this.state.selectedTab) + 1);
  };

  onPrev = (): void => {
    this.setTab(Number(this.state.selectedTab) - 1);
  };

  constructor() {
    Emitter.on("next-tab", this.onNext);
    Emitter.on("previous-tab", this.onPrev);
  }

  init(_swiper: unknown, segments: unknown): void {
    void _swiper;
    this.state.segments = segments as Record<string, any>;
  }

  layout(): void {
    // Direct tab switching requires no horizontal carousel re-measurement.
  }

  destroy(): void {
    if (!this.listenersOff) {
      Emitter.off("next-tab", this.onNext);
      Emitter.off("previous-tab", this.onPrev);
      this.listenersOff = true;
    }
  }

  setTab(index: number | string | undefined, smooth = true): void {
    const parsed = parseInt((index ?? 0).toString(), 10);
    if (isNaN(parsed)) return;

    const nodes = this.state.segments?.$el?.children || this.state.segments?.$el?.childNodes;
    const count = nodes ? nodes.length : 0;
    if (parsed < 0 || (count > 0 && parsed >= count)) return;

    this.state.selectedTab = parsed;
    this.state.visibleTab = parsed;

    const segment = nodes ? nodes[parsed] : null;
    if (segment && typeof segment.scrollIntoView === "function") {
      segment.scrollIntoView({
        behavior: smooth ? 'smooth' : 'instant',
        block: 'nearest',
        inline: 'center'
      });
    }
  }

  isVisible(id: number): boolean {
    return this.state.selectedTab === id || (this.state.visibleTab >= id - 1 && this.state.visibleTab <= id + 1);
  }
}
