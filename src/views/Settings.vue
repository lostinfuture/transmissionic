<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="#" text="" @click="modalClose()"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ Locale.settings }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="saveSettings()" fill="clear" aria-label="Save">
            <ion-icon slot="icon-only" :ios="saveOutline" :md="saveSharp"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment ref="tabs" @ionChange="tabController.setTab($event.detail.value)" v-model="tabController.state.selectedTab" scrollable>
          <ion-segment-button :value="0" id="tab0">
            <ion-label>{{ Locale.client || Locale.interface }}</ion-label>
          </ion-segment-button>
          <ion-segment-button :value="1" id="tab1">
            <ion-label>{{ Locale.servers }}</ion-label>
          </ion-segment-button>
          <ion-segment-button v-if="hasServerConfig" :value="2" id="tab2">
            <ion-label>{{ Locale.download }}</ion-label>
          </ion-segment-button>
          <ion-segment-button v-if="hasServerConfig" :value="3" id="tab3">
            <ion-label>{{ Locale.limits }}</ion-label>
          </ion-segment-button>
          <ion-segment-button v-if="hasServerConfig" :value="4" id="tab4">
            <ion-label>{{ Locale.network }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <div class="swiper" ref="swiper">
      <div class="swiper-wrapper">
        <!-- Client tab -->
        <div class="swiper-slide" role="tabpanel" aria-labelledby="tab0" :aria-hidden="tabController.state.selectedTab!=0">
          <ion-content :fullscreen="true" class="ion-padding" ref="tab0">
            <ion-list>
              <ion-list-header>
                <ion-label>
                  {{ Locale.interface }}
                </ion-label>
              </ion-list-header>

              <ion-item>
                <ion-select :label="Locale.language" label-placement="start" justify="space-between" placeholder="Select One" v-model="sharedState.language" :okText="Locale.ok" :cancelText="Locale.actions.cancel">
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
                <ion-select :label="Locale.theme" label-placement="start" justify="space-between" placeholder="Select One" v-model="sharedState.colorScheme" :okText="Locale.ok" :cancelText="Locale.actions.cancel">
                  <ion-select-option value="default">{{ Locale.default }}</ion-select-option>
                  <ion-select-option value="light">{{ Locale.light }}</ion-select-option>
                  <ion-select-option value="dark">{{ Locale.dark }}</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item>
                <ion-toggle v-model="sharedState.useBits" justify="space-between" class="swiper-no-swiping">{{ Locale.speedUnit }}</ion-toggle>
              </ion-item>

              <ion-item>
                <ion-toggle v-model="sharedState.compactMode" justify="space-between" class="swiper-no-swiping">{{ Locale.compactMode }}</ion-toggle>
              </ion-item>

              <ion-item>
                <ion-toggle v-model="sharedState.expandMenu" justify="space-between" class="swiper-no-swiping">{{ Locale.expandSideMenu }}</ion-toggle>
              </ion-item>

              <ion-item>
                <ion-toggle v-model="sharedState.showTrackerList" justify="space-between" class="swiper-no-swiping">{{ Locale.showTrackerList }}</ion-toggle>
              </ion-item>

              <ion-item>
                <ion-toggle v-model="sharedState.ipFlags" justify="space-between" class="swiper-no-swiping">{{ Locale.displayFlag }}*</ion-toggle>
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
                <ion-label>{{ Locale.refreshInterval }}</ion-label>
                <div class="row-controls swiper-no-swiping" slot="end">
                  <ion-input class="compact-input" :aria-label="Locale.refreshInterval" type="number" v-model.number="sharedState.refreshInterval"></ion-input>
                </div>
              </ion-item>
              <ion-item>
                <ion-label>{{ Locale.connectionTimeout }}</ion-label>
                <div class="row-controls swiper-no-swiping" slot="end">
                  <ion-input class="compact-input" :aria-label="Locale.connectionTimeout" type="number" v-model.number="sharedState.timeout"></ion-input>
                </div>
              </ion-item>
            </ion-list>

            <ion-list>
              <ion-list-header>
                <ion-label>
                  {{ Locale.searchBy }}
                </ion-label>
              </ion-list-header>

              <ion-item>
                <ion-checkbox justify="space-between" label-placement="start" v-model="sharedState.searchByName" class="swiper-no-swiping">{{ Locale.name }}</ion-checkbox>
              </ion-item>

              <ion-item>
                <ion-checkbox justify="space-between" label-placement="start" v-model="sharedState.searchByDirectory" class="swiper-no-swiping">{{ Locale.downloadDir }}</ion-checkbox>
              </ion-item>
            </ion-list>

            <ion-list>
              <ion-list-header>
                <ion-label>
                  {{ Locale.preset }}
                </ion-label>
              </ion-list-header>

              <ion-item>
                <ion-toggle v-model="sharedState.rememberSelectedPreset" justify="space-between" class="swiper-no-swiping">{{ Locale.rememberSelectedPreset }}</ion-toggle>
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
                <ion-toggle v-model="sharedState.openMagnetLinks" justify="space-between" class="swiper-no-swiping">{{ Locale.openMagnetLinks }}</ion-toggle>
              </ion-item>
            </ion-list>

            <ion-list v-if="bookmarkletEnabled">
              <ion-list-header>
                <ion-label>
                  {{ Locale.bookmarklet }}
                </ion-label>
              </ion-list-header>

              <ion-item>
                <p class="item-prose">{{ Locale.bookmarkletDetail }}</p>
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
                <ion-button size="default" class="danger-button" @click="resetSettings()">{{ Locale.resetSettings }}</ion-button>
              </div>
            </ion-list>
          </ion-content>
        </div>

        <!-- Servers tab -->
        <div class="swiper-slide" role="tabpanel" aria-labelledby="tab1" :aria-hidden="tabController.state.selectedTab!=1">
          <ion-content class="ion-padding" ref="tab1">
            <ion-list
              v-for="(s, i) in serverList"
              :key="i"
              class="server-card"
              :class="{ 'selected-server-card': selectedServer === i }"
            >
              <ion-item
                @click="selectServer(i)"
                :detail="false"
                class="server-header-item"
                :class="{ 'selected-server': selectedServer === i }"
                button
              >
                <ion-icon slot="start" class="server-row-icon" :ios="serverOutline" :md="serverSharp"></ion-icon>
                <ion-label>{{ s.name }}</ion-label>
                <ion-button
                  slot="end"
                  fill="clear"
                  class="server-edit-btn"
                  @click.stop="editServer(i)"
                  :aria-label="Locale.serverDetails"
                >
                  <ion-icon slot="icon-only" :ios="pencilOutline" :md="pencilSharp"></ion-icon>
                </ion-button>
              </ion-item>

              <template v-if="selectedServer === i && hasServerConfig && config">
                <ion-item>
                  <ion-label>{{ Locale.transmissionVersion }}</ion-label>
                  <span slot="end" class="info-value tabular selectable">{{ config.version || "—" }}</span>
                </ion-item>
                <ion-item>
                  <ion-label>{{ Locale.freeSpace }}</ion-label>
                  <span slot="end" class="info-value tabular selectable">{{ freeSpaceFormatted }}</span>
                </ion-item>
                <ion-item>
                  <ion-label>{{ Locale.port }}</ion-label>
                  <span slot="end" class="info-value tabular selectable">{{ config["peer-port"] ?? "—" }}</span>
                </ion-item>
              </template>
            </ion-list>

            <div class="server-actions">
              <ion-button size="default" @click="addServer()">
                <ion-icon slot="start" :ios="addOutline" :md="addSharp"></ion-icon>
                {{ Locale.addServer || "Add server" }}
              </ion-button>
            </div>
          </ion-content>
        </div>

        <!-- Download tab -->
        <div v-if="hasServerConfig" class="swiper-slide" role="tabpanel" aria-labelledby="tab2" :aria-hidden="tabController.state.selectedTab!=2">
          <ion-content class="ion-padding" ref="tab2">
            <ion-list>
              <ion-list-header>
                <ion-label>
                  {{ Locale.general }}
                </ion-label>
              </ion-list-header>

              <ion-item>
                <div class="stacked-field swiper-no-swiping">
                  <span class="field-label">{{ Locale.defaultDownloadDir }}</span>
                  <ion-input :aria-label="Locale.defaultDownloadDir" v-model="config['download-dir']"></ion-input>
                </div>
              </ion-item>

              <ion-item>
                <ion-label>{{ Locale.cacheSize + ' (M' + Locale.units.byte + ')' }}</ion-label>
                <div class="row-controls swiper-no-swiping" slot="end">
                  <ion-input class="compact-input" :aria-label="Locale.cacheSize" v-model.number="config['cache-size-mb']" type="number"></ion-input>
                </div>
              </ion-item>

              <ion-item>
                <ion-toggle v-model="config['start-added-torrents']" justify="space-between" class="swiper-no-swiping">{{ Locale.startAddedTorrents }}</ion-toggle>
              </ion-item>
            </ion-list>

            <ion-list>
              <ion-list-header>
                <ion-label>
                  {{ Locale.queue }}
                </ion-label>
              </ion-list-header>

              <ion-item>
                <ion-toggle v-model="config['download-queue-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.enabled }}</ion-toggle>
              </ion-item>

              <ion-item :disabled="!config['download-queue-enabled']">
                <ion-label>{{ Locale.queueSize }}</ion-label>
                <div class="row-controls swiper-no-swiping" slot="end">
                  <ion-input class="compact-input" :aria-label="Locale.queueSize" v-model.number="config['download-queue-size']" type="number"></ion-input>
                </div>
              </ion-item>

              <ion-item>
                <ion-label>{{ Locale.stopWhenInactive }}</ion-label>
                <div class="row-controls swiper-no-swiping" slot="end">
                  <ion-input class="compact-input" :aria-label="Locale.stopWhenInactive" v-model.number="config['queue-stalled-minutes']" type="number" :disabled="!config['queue-stalled-enabled']"></ion-input>
                  <ion-toggle v-model="config['queue-stalled-enabled']" :aria-label="Locale.stopWhenInactive"></ion-toggle>
                </div>
              </ion-item>
            </ion-list>

            <ion-list>
              <ion-list-header>
                <ion-label>
                  {{ Locale.incompleteDownloads }}
                </ion-label>
              </ion-list-header>

              <ion-item>
                <ion-toggle v-model="config['rename-partial-files']" justify="space-between" class="swiper-no-swiping">{{ Locale.addPartExt }}</ion-toggle>
              </ion-item>

              <ion-item>
                <ion-toggle v-model="config['incomplete-dir-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.useTempDir }}</ion-toggle>
              </ion-item>

              <ion-item :disabled="!config['incomplete-dir-enabled']">
                <div class="stacked-field swiper-no-swiping">
                  <span class="field-label">{{ Locale.tempDirPath }}</span>
                  <ion-input :aria-label="Locale.tempDirPath" v-model="config['incomplete-dir']"></ion-input>
                </div>
              </ion-item>
            </ion-list>
          </ion-content>
        </div>

        <!-- Limits tab -->
        <div v-if="hasServerConfig" class="swiper-slide" role="tabpanel" aria-labelledby="tab3" :aria-hidden="tabController.state.selectedTab!=3">
          <ion-content class="ion-padding" ref="tab3">
            <ion-list>
              <ion-list-header>
                <ion-label>
                  {{ Locale.bandwidth }}
                </ion-label>
              </ion-list-header>

              <ion-item>
                <ion-label>{{ Locale.downloadLimit + ' (' + speedUnit + ')' }}</ion-label>
                <div class="row-controls swiper-no-swiping" slot="end">
                  <ion-input class="compact-input" :aria-label="Locale.downloadLimit" v-model.number="config['speed-limit-down']" type="number" :disabled="!config['speed-limit-down-enabled']"></ion-input>
                  <ion-toggle v-model="config['speed-limit-down-enabled']" :aria-label="Locale.downloadLimit"></ion-toggle>
                </div>
              </ion-item>

              <ion-item>
                <ion-label>{{ Locale.uploadLimit + ' (' + speedUnit + ')' }}</ion-label>
                <div class="row-controls swiper-no-swiping" slot="end">
                  <ion-input class="compact-input" :aria-label="Locale.uploadLimit" v-model.number="config['speed-limit-up']" type="number" :disabled="!config['speed-limit-up-enabled']"></ion-input>
                  <ion-toggle v-model="config['speed-limit-up-enabled']" :aria-label="Locale.uploadLimit"></ion-toggle>
                </div>
              </ion-item>
            </ion-list>

            <ion-list>
              <ion-list-header>
                <ion-label>
                  {{ Locale.altSpeed }}
                </ion-label>
              </ion-list-header>

              <ion-item>
                <ion-toggle v-model="config['alt-speed-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.enabled }}</ion-toggle>
              </ion-item>

              <ion-item>
                <ion-label>{{ Locale.downloadLimit + ' (' + speedUnit + ')' }}</ion-label>
                <div class="row-controls swiper-no-swiping" slot="end">
                  <ion-input class="compact-input" :aria-label="Locale.downloadLimit" v-model.number="config['alt-speed-down']" type="number"></ion-input>
                </div>
              </ion-item>

              <ion-item>
                <ion-label>{{ Locale.uploadLimit + ' (' + speedUnit + ')' }}</ion-label>
                <div class="row-controls swiper-no-swiping" slot="end">
                  <ion-input class="compact-input" :aria-label="Locale.uploadLimit" v-model.number="config['alt-speed-up']" type="number"></ion-input>
                </div>
              </ion-item>
            </ion-list>

            <ion-list>
              <ion-list-header>
                <ion-label>
                  {{ Locale.altSpeedScheduler }}
                </ion-label>
              </ion-list-header>

              <ion-item>
                <ion-toggle v-model="config['alt-speed-time-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.enabled }}</ion-toggle>
              </ion-item>

              <ion-item :disabled="!config['alt-speed-time-enabled']">
                <ion-label>{{ Locale.altSpeedBegin }}</ion-label>
                <div class="row-controls swiper-no-swiping" slot="end">
                  <ion-input class="compact-input time-input" :aria-label="Locale.altSpeedBegin" type="time" v-model="altSpeedTimeBegin"/>
                </div>
              </ion-item>

              <ion-item :disabled="!config['alt-speed-time-enabled']">
                <ion-label>{{ Locale.altSpeedEnd }}</ion-label>
                <div class="row-controls swiper-no-swiping" slot="end">
                  <ion-input class="compact-input time-input" :aria-label="Locale.altSpeedEnd" type="time" v-model="altSpeedTimeEnd"/>
                </div>
              </ion-item>

              <ion-item :disabled="!config['alt-speed-time-enabled']">
                <ion-select :label="Locale.altSpeedDays" label-placement="start" justify="space-between" :placeholder="Locale.never" :multiple="true" v-model="altSpeedTimeDay" :okText="Locale.ok" :cancelText="Locale.actions.cancel">
                  <ion-select-option v-for="(day,id) in getWeekDays" :value="id" :key="id">{{day}}</ion-select-option>
                </ion-select>
              </ion-item>
            </ion-list>

            <ion-list>
              <ion-list-header>
                <ion-label>
                  {{ Locale.seed }}
                </ion-label>
              </ion-list-header>

              <ion-item>
                <ion-label>{{ Locale.seedRatioLimit }}</ion-label>
                <div class="row-controls swiper-no-swiping" slot="end">
                  <ion-input class="compact-input" :aria-label="Locale.seedRatioLimit" v-model.number="config.seedRatioLimit" type="number" :disabled="!config.seedRatioLimited"></ion-input>
                  <ion-toggle v-model="config.seedRatioLimited" :aria-label="Locale.seedRatioLimit"></ion-toggle>
                </div>
              </ion-item>

              <ion-item>
                <ion-label>{{ Locale.stopWhenInactive }}</ion-label>
                <div class="row-controls swiper-no-swiping" slot="end">
                  <ion-input class="compact-input" :aria-label="Locale.stopWhenInactive" v-model.number="config['idle-seeding-limit']" type="number" :disabled="!config['idle-seeding-limit-enabled']"></ion-input>
                  <ion-toggle v-model="config['idle-seeding-limit-enabled']" :aria-label="Locale.stopWhenInactive"></ion-toggle>
                </div>
              </ion-item>
            </ion-list>

            <ion-list>
              <ion-list-header>
                <ion-label>
                  {{ LocaleController.getForm("peer","other") }}
                </ion-label>
              </ion-list-header>

              <ion-item>
                <ion-label>{{ Locale.globalPeerLimit }}</ion-label>
                <div class="row-controls swiper-no-swiping" slot="end">
                  <ion-input class="compact-input" :aria-label="Locale.globalPeerLimit" v-model.number="config['peer-limit-global']" type="number"></ion-input>
                </div>
              </ion-item>

              <ion-item>
                <ion-label>{{ Locale.peerLimitByTorrent }}</ion-label>
                <div class="row-controls swiper-no-swiping" slot="end">
                  <ion-input class="compact-input" :aria-label="Locale.peerLimitByTorrent" v-model.number="config['peer-limit-per-torrent']" type="number"></ion-input>
                </div>
              </ion-item>
            </ion-list>
          </ion-content>
        </div>

        <!-- Network tab -->
        <div v-if="hasServerConfig" class="swiper-slide" role="tabpanel" aria-labelledby="tab4" :aria-hidden="tabController.state.selectedTab!=4">
          <ion-content class="ion-padding" ref="tab4">
            <ion-list>
              <ion-list-header>
                <ion-label>
                  {{ Locale.general }}
                </ion-label>
              </ion-list-header>

              <ion-item>
                <ion-select :label="Locale.encryption" label-placement="start" justify="space-between" placeholder="Select One" v-model="config.encryption" :okText="Locale.ok" :cancelText="Locale.actions.cancel">
                  <ion-select-option value="required">{{ Locale.required }}</ion-select-option>
                  <ion-select-option value="preferred">{{ Locale.preferred }}</ion-select-option>
                  <ion-select-option value="tolerated">{{ Locale.tolerated }}</ion-select-option>
                </ion-select>
              </ion-item>
            </ion-list>

            <ion-list>
              <ion-list-header>
                <ion-label>
                  {{ Locale.peerPort }}
                </ion-label>
              </ion-list-header>

              <ion-item :disabled="config['peer-port-random-on-start']">
                <ion-label>{{ Locale.port }}</ion-label>
                <div class="row-controls swiper-no-swiping" slot="end">
                  <ion-input class="compact-input" :aria-label="Locale.port" v-model.number="config['peer-port']" type="number"></ion-input>
                </div>
              </ion-item>

              <ion-item>
                <ion-toggle v-model="config['peer-port-random-on-start']" justify="space-between" class="swiper-no-swiping">{{ Locale.randomPortOnStart }}</ion-toggle>
              </ion-item>

              <ion-item>
                <ion-toggle v-model="config['port-forwarding-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.portForwarding }}</ion-toggle>
              </ion-item>

              <div class="ion-padding small">
                <ion-button size="default" @click="testPort()">{{ Locale.testPort }}</ion-button>
                <span v-if="portStatus !== null" class="port-status" :class="portStatus ? 'open' : 'closed'" role="status">
                  <span class="dot" aria-hidden="true"></span>
                  <span class="tabular">{{ config['peer-port'] }}: {{ portStatus ? Locale.success : Locale.error.error }}</span>
                </span>
              </div>
            </ion-list>

            <ion-list>
              <ion-list-header>
                <ion-label>
                  {{ Locale.protocols }}
                </ion-label>
              </ion-list-header>

              <ion-item>
                <ion-toggle v-model="config['dht-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.DHT }} (DHT)</ion-toggle>
              </ion-item>

              <ion-item>
                <ion-toggle v-model="config['lpd-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.LPD }} (LPD)</ion-toggle>
              </ion-item>

              <ion-item>
                <ion-toggle v-model="config['pex-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.PEX }} (PEX)</ion-toggle>
              </ion-item>

              <ion-item>
                <ion-toggle v-model="config['utp-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.UTP }} (µTP)</ion-toggle>
              </ion-item>
            </ion-list>

            <ion-list>
              <ion-list-header>
                <ion-label>
                  {{ Locale.blocklist }}
                </ion-label>
              </ion-list-header>

              <ion-item>
                <ion-toggle v-model="config['blocklist-enabled']" justify="space-between" class="swiper-no-swiping">{{ Locale.enabled }}</ion-toggle>
              </ion-item>

              <ion-item :disabled="!config['blocklist-enabled']">
                <div class="stacked-field swiper-no-swiping">
                  <span class="field-label">{{ Locale.blocklistUrl }}</span>
                  <ion-input :aria-label="Locale.blocklistUrl" v-model="config['blocklist-url']"></ion-input>
                </div>
              </ion-item>

              <div class="ion-padding small">
                <ion-button size="default" @click="updateBlocklist()">{{ Locale.updateBlocklist }}</ion-button>
              </div>
            </ion-list>
          </ion-content>
        </div>
      </div>
    </div>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue';
import {
  modalController,
  alertController,
  loadingController,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
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
  informationCircleSharp,
  serverOutline,
  serverSharp,
  pencilOutline,
  pencilSharp,
  addOutline,
  addSharp
} from 'ionicons/icons';
import TabController from '../services/TabController';
import { TransmissionRPC } from "../services/TransmissionRPC";
import { Utils } from "../services/Utils";
import { Locale } from "../services/Locale";
import { LocaleController } from "../services/LocaleController";
import { UserSettings } from "../services/UserSettings";
import { FileHandler } from '../services/FileHandler';
import { Emitter } from '../services/Emitter';
import * as _ from 'lodash';

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
  props: {
    initialTab: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      sharedState: UserSettings.state,
      config: TransmissionRPC.sessionArguments ? _.clone(TransmissionRPC.sessionArguments) : null as Record<string, any> | null,
      portStatus: null as null | boolean,
      connectionStatus: {} as Record<string, any>,
      serverList: [] as Array<Record<string, any>>,
      selectedServer: 0
    }
  },
  components: {
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSegment,
    IonSegmentButton,
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
  watch: {
    "sharedState.useBits"(newVal: boolean, oldVal: boolean) {
      if (this.config && newVal !== oldVal) {
        const factor = newVal ? 8 : 1 / 8;
        this.config['alt-speed-up'] = Math.round(this.config['alt-speed-up'] * factor);
        this.config['alt-speed-down'] = Math.round(this.config['alt-speed-down'] * factor);
        this.config['speed-limit-up'] = Math.round(this.config['speed-limit-up'] * factor);
        this.config['speed-limit-down'] = Math.round(this.config['speed-limit-down'] * factor);
      }
    },
    "connectionStatus.sessionArguments"(newSessionArgs: Record<string, any> | null) {
      if (newSessionArgs) {
        const nextConfig = _.clone(newSessionArgs);
        this.applySpeedMultiplier(nextConfig);
        this.config = nextConfig;
        this.portStatus = null;
        this.$nextTick(() => {
          Utils.customScrollbar(this.$refs.tab2);
          Utils.customScrollbar(this.$refs.tab3);
          Utils.customScrollbar(this.$refs.tab4);
        });
        this.refreshServerInfo();
      } else {
        this.config = null;
        this.portStatus = null;
        if (this.tabController.state.selectedTab > 1) {
          this.tabController.setTab(1, false);
        }
      }
    }
  },
  computed: {
    hasServerConfig(): boolean {
      return Boolean(this.config && Object.keys(this.config).length > 0);
    },
    freeSpaceFormatted(): string {
      if (!this.config) return "—";
      const bytes = this.config["download-dir-free-space"];
      return (Utils.formatBytes(bytes) as string) || "—";
    },
    bookmarkletEnabled(): boolean {
      return !isPlatform("electron") && !isPlatform("capacitor")
    },
    protocolHandlerAvailable(): boolean {
      return !isPlatform("electron") && !isPlatform("capacitor") && navigator.registerProtocolHandler!==undefined
    },
    speedUnit(): string {
      return 'K' + (this.sharedState.useBits ? Locale.units.bit : Locale.units.byte) + Locale.units.perSecond;
    },
    altSpeedTimeBegin: {
      get(): string {
        return this.config ? this.minutesToHhmm(this.config['alt-speed-time-begin']) : "00:00";
      },
      set(value: string) {
        if (this.config) {
          this.config['alt-speed-time-begin'] = this.HhmmToMinutes(value);
        }
      }
    },
    altSpeedTimeEnd: {
      get(): string {
        return this.config ? this.minutesToHhmm(this.config['alt-speed-time-end']) : "00:00";
      },
      set(value: string) {
        if (this.config) {
          this.config['alt-speed-time-end'] = this.HhmmToMinutes(value);
        }
      }
    },
    altSpeedTimeDay: {
      get(): Array<number> {
        if (!this.config) return [];
        const binary = (this.config['alt-speed-time-day'] >>> 0).toString(2).padStart(7,'0');
        const numbers=[];
        for (let i = 1; i < 7; i++) {
          if(binary[i]=='1'){
            numbers.push(i-1);
          }
        }
        if(binary[0]=='1'){
          numbers.push(6);
        }
        return numbers;
      },
      set(value: Array<number>) {
        if (!this.config) return;
        let binary=value.includes(6) ? '1' : '0';
        for (let i = 0; i < 6; i++) {
          binary+=value.includes(i) ? '1' : '0';
        }
        this.config['alt-speed-time-day'] = parseInt(binary, 2);
      }
    },
    getWeekDays(): Array<string> {
      const locale = UserSettings.getLanguage();
      const baseDate = new Date(Date.UTC(2017, 0, 2));
      const weekDays = [];
      for(let i = 0; i < 7; i++) {
        const day = baseDate.toLocaleDateString(locale, { weekday: 'long' })
          .split(' ')
          .map(w => w.substring(0,1).toUpperCase()+w.substring(1))
          .join(' ');
        weekDays.push(day);
        baseDate.setDate(baseDate.getDate() + 1);
      }
      return weekDays;
    }
  },
  setup() {
    Utils.pushState();
    const href = window.location.href.replace(window.location.hash,"");
    const bookmarkletScript = `javascript:(${bookmarkletFunction})("${href}");`;
    const tabController = new TabController();

    return {
      Locale,
      LocaleController,
      Utils,
      tabController,
      bookmarkletScript,
      saveOutline,
      saveSharp,
      informationCircleOutline,
      informationCircleSharp,
      serverOutline,
      serverSharp,
      pencilOutline,
      pencilSharp,
      addOutline,
      addSharp
    }
  },
  created() {
    this.connectionStatus = (inject('connectionStatus') as Record<string, any>) || {};
    this.serverList = (inject('serverList') as any) || [];
    this.selectedServer = (inject('selectedServer') as any) ?? 0;
    this.applySpeedMultiplier(this.config);
  },
  mounted() {
    Utils.customScrollbar(this.$refs.tab0);
    Utils.customScrollbar(this.$refs.tab1);
    if (this.hasServerConfig) {
      Utils.customScrollbar(this.$refs.tab2);
      Utils.customScrollbar(this.$refs.tab3);
      Utils.customScrollbar(this.$refs.tab4);
    }
    this.tabController.init(this.$refs.swiper, this.$refs.tabs);
    if (this.initialTab) {
      this.tabController.setTab(this.initialTab, false);
    }
    this.refreshServerInfo();
  },
  beforeUnmount() {
    this.tabController.destroy();
  },
  methods: {
    applySpeedMultiplier(target: Record<string, any> | null) {
      if (target && UserSettings.state.useBits) {
        target['alt-speed-up'] = target['alt-speed-up'] * 8;
        target['alt-speed-down'] = target['alt-speed-down'] * 8;
        target['speed-limit-up'] = target['speed-limit-up'] * 8;
        target['speed-limit-down'] = target['speed-limit-down'] * 8;
      }
    },
    async refreshServerInfo() {
      if (TransmissionRPC.sessionArguments) {
        try {
          await TransmissionRPC.refreshFreeSpace();
          if (this.config && TransmissionRPC.sessionArguments) {
            this.config['download-dir-free-space'] = TransmissionRPC.sessionArguments['download-dir-free-space'];
          }
        } catch (e) {
          return;
        }
      }
    },
    selectServer(serverId: number) {
      if (this.selectedServer !== serverId || !this.connectionStatus.connected) {
        Emitter.emit("select-server", serverId);
      }
    },
    editServer(serverId: number) {
      Emitter.emit("edit-server", serverId);
    },
    addServer() {
      Emitter.emit("add-server");
    },
    minutesToHhmm(minutes: number) {
      const hours = Math.floor(minutes/60);
      const min = minutes%60;
      return `${hours.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
    },
    HhmmToMinutes(hhmm: string) {
      const parts = hhmm.split(':');
      return parseInt(parts[0])*60 + parseInt(parts[1]);
    },
    async updateBlocklist() {
      const loading = await loadingController.create({});
      await loading.present();
      await TransmissionRPC.rpcCall("blocklist-update")
        .then((response) => {
          const size = response.arguments['blocklist-size'].toLocaleString(UserSettings.getLanguage());
          Utils.responseToast(Locale.formatString(Locale.blocklistSize,size).toString());
        })
        .catch((error) => {
          Utils.responseToast(error.message);
        });
      loading.dismiss();
    },
    async testPort() {
      const loading = await loadingController.create({});
      await loading.present();
      await TransmissionRPC.rpcCall("port-test")
        .then((response) => {
          const isOpen = Boolean(response.arguments && (response.arguments['port-is-open'] ?? response.arguments['port_is_open']));
          this.portStatus = isOpen;
          Utils.responseToast(isOpen ? "success" : Locale.error.error);
        })
        .catch((error) => {
          this.portStatus = null;
          Utils.responseToast(error.message);
        });
      loading.dismiss();
    },
    async saveSettings () {
      UserSettings.saveSettings();
      Utils.registerMagnetLinkProtocol();

      if (this.config && TransmissionRPC.sessionArguments) {
        const tmpArgs = _.clone(this.config);
        const args: Record<string, any> = {};

        if (UserSettings.state.useBits) {
          tmpArgs['alt-speed-up'] = Math.round(tmpArgs['alt-speed-up'] / 8);
          tmpArgs['alt-speed-down'] = Math.round(tmpArgs['alt-speed-down'] / 8);
          tmpArgs['speed-limit-up'] = Math.round(tmpArgs['speed-limit-up'] / 8);
          tmpArgs['speed-limit-down'] = Math.round(tmpArgs['speed-limit-down'] / 8);
        }

        for (const key in tmpArgs) {
          if (!_.isEqual(tmpArgs[key], TransmissionRPC.sessionArguments[key])) {
            args[key] = tmpArgs[key];
          }
        }

        if (Object.keys(args).length > 0) {
          const loading = await loadingController.create({});
          await loading.present();
          await TransmissionRPC.setSession(args)
            .then((response) => {
              Utils.responseToast(response.result);
            })
            .catch((error) => {
              Utils.responseToast(error.message);
            });
          loading.dismiss();
          return;
        }
      }

      Utils.responseToast("success");
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
ion-content {
  text-align: initial;
}

.annotation {
  padding: 10px 16px 0px 16px;
  color: var(--ion-color-medium);
}

.annotation a {
  color: inherit;
}

.annotation ion-icon {
  vertical-align: middle;
}

#importPreset {
  display: none;
}

.port-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border-radius: var(--radius-control);
  font-size: var(--fs-small);
  font-weight: 500;
}

.port-status .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.port-status.open {
  color: var(--positive);
  background: rgba(108, 199, 149, 0.14);
}

.port-status.closed {
  color: var(--negative);
  background: var(--pill-negative-bg);
}

.server-row-icon {
  font-size: 18px;
  width: 18px;
  height: 18px;
  color: var(--muted);
  margin-inline-end: 12px;
}

ion-item.server-header-item {
  --background: var(--raised);
  --border-color: var(--line);
  font-weight: 600;
}

ion-item.selected-server {
  --background: var(--active);
  --color: var(--ink);
  font-weight: 600;
}

ion-item.selected-server .server-row-icon {
  color: var(--ink);
}

.server-actions {
  padding: 4px 0 12px;
  display: flex;
  align-items: center;
}

.server-actions ion-button ion-icon {
  font-size: 16px !important;
  width: 16px !important;
  height: 16px !important;
  margin-inline-end: 6px;
}

.server-edit-btn {
  --color: var(--muted);
  --padding-start: 8px;
  --padding-end: 8px;
  margin: 0;
  height: 32px;
  width: 32px;
}

.server-edit-btn ion-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
}

.info-value {
  font-size: var(--fs-body);
  color: var(--muted);
}
</style>
