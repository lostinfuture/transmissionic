import { reactive } from 'vue';
import { isPlatform } from "@ionic/vue";
import { Emitter } from './Emitter';
import Swiper from 'swiper';
import { swiperAction } from './swiperLayout';

import 'swiper/css/bundle'

export default class TabController {
  state = reactive({
    selectedTab:0,
    visibleTab:0,
    swiper:{} as Swiper,
    segments:{} as Record<string,any>
  })

  el: HTMLElement | null = null;
  observer: ResizeObserver | null = null;
  modalEl: Element | null = null;
  onModalPresent: (() => void) | null = null;
  mountedSwiper = false;
  lastWidth = 0;
  lastHeight = 0;
  generation = 0;
  retryQueued = false;
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

  init(swiper: unknown, segments: unknown): void {
    const el = swiper as HTMLElement;
    this.state.segments = segments as Record<string,any>;
    if (!el || typeof el.offsetWidth !== "number") return;

    this.unbindSurface();
    this.el = el;

    const modal = typeof el.closest === "function" ? el.closest("ion-modal") : null;
    if (modal) {
      this.onModalPresent = () => this.layout();
      modal.addEventListener("ionModalDidPresent", this.onModalPresent);
      this.modalEl = modal;
    }

    if (typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(() => this.layout());
      this.observer.observe(el);
    }

    this.layout();
  }

  layout(): void {
    const el = this.el;
    if (!el) return;

    const width = el.offsetWidth;
    const height = el.offsetHeight;
    const action = swiperAction(width, height, this.mountedSwiper, this.lastWidth, this.lastHeight);
    if (action === "mount") {
      this.mount(el, width, height);
      return;
    }
    if (action === "update") {
      this.lastWidth = width;
      this.lastHeight = height;
      this.state.swiper.update();
      return;
    }
    if (!this.mountedSwiper) {
      this.queueRetry();
    }
  }

  destroy(): void {
    this.unbindSurface();
    this.el = null;
    const swiper = this.state.swiper as Swiper;
    if (swiper && typeof swiper.destroy === "function") {
      swiper.destroy(true, true);
    }
    this.mountedSwiper = false;
    this.lastWidth = 0;
    this.lastHeight = 0;
    this.state.swiper = {} as Swiper;
    if (!this.listenersOff) {
      Emitter.off("next-tab", this.onNext);
      Emitter.off("previous-tab", this.onPrev);
      this.listenersOff = true;
    }
  }

  private mount(el: HTMLElement, width: number, height: number): void {
    const self = this;
    this.state.swiper = new Swiper(el, {
      centeredSlides:true,
      initialSlide:this.state.selectedTab,
      resistanceRatio:isPlatform("ios") ? 0.85 : 0,
      simulateTouch:false,
      on: {
        transitionEnd: () => self.slideChanged()
      }
    });
    this.mountedSwiper = true;
    this.lastWidth = width;
    this.lastHeight = height;
  }

  private queueRetry(): void {
    if (this.retryQueued || this.mountedSwiper || !this.el) return;
    this.retryQueued = true;
    const generation = this.generation;
    let attempt = 0;
    const step = () => {
      this.retryQueued = false;
      if (generation !== this.generation || !this.el || this.mountedSwiper) return;
      const width = this.el.offsetWidth;
      const height = this.el.offsetHeight;
      if (swiperAction(width, height, false, 0, 0) === "mount") {
        this.mount(this.el, width, height);
        return;
      }
      if (attempt >= 12) return;
      attempt += 1;
      this.retryQueued = true;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  private unbindSurface(): void {
    this.generation += 1;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.modalEl && this.onModalPresent) {
      this.modalEl.removeEventListener("ionModalDidPresent", this.onModalPresent);
    }
    this.modalEl = null;
    this.onModalPresent = null;
  }

  setTab(index: number|string|undefined, smooth=true): void {
    index = parseInt((index||0).toString());
    const nodes = this.state.segments?.$el?.childNodes;
    if(nodes && index >= 0 && index <= nodes.length){
      const swiper = this.state.swiper;
      if(swiper && typeof swiper.slideTo === "function"){
        swiper.slideTo(index);
      }
      else {
        this.state.selectedTab=index;
        this.state.visibleTab=index;
      }

      const segment = nodes[index];
      if(segment && segment.scrollIntoView){
        segment.scrollIntoView({
          behavior: smooth ? 'smooth' : 'instant',
          block: 'center',
          inline: 'center'
        });
      }
    }
  }

  async slideChanged(): Promise<void> {
    const activeIndex = this.state.swiper.activeIndex;
    if(activeIndex!=null){
      this.state.selectedTab=activeIndex;
      this.state.visibleTab=activeIndex;
      this.setTab(activeIndex, false);
    }
  }

  isVisible(id: number): boolean{
    return (this.state.visibleTab >= id-1 && this.state.visibleTab <= id+1);
  }

}
