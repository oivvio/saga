// eslint-disable-next-line
import { Subject } from "rxjs";
import { ComponentCustomProperties } from "vue";
import { Store, createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";
import { IGameConfig } from "../station";
import { loadGameConfig } from "../station";

interface IUserState {
  QRScannerCanBeDisplayed: boolean;
  QRScannerIsDisplayed: boolean;
  showQRScanner: boolean;
  stationsVisited: string[];
  lastStationVisitedId?: string;
  tags: string[];
  timers: Record<string, number>;
  helpAvailable: number;
}

export interface IState {
  dummyCounter: number;
  gameConfigLoaded: boolean;
  gameConfig?: IGameConfig;
  user: IUserState;
  audio: {
    volume: number;
    story: {
      isPlaying: boolean;
      data: string | null;
    };
    background: {
      isPlaying: boolean;
      data: string | null;
    };
  };
}

// This is a trick to get the store to work with TypeScript
declare module "@vue/runtime-core" {
  // declare your own store states

  // provide typings for `this.$store`
  interface ComponentCustomProperties {
    $store: Store<IState>;
  }
}

const initialState: IState = {
  dummyCounter: 1,
  gameConfigLoaded: false,
  gameConfig: undefined,
  user: {
    QRScannerCanBeDisplayed: true,
    QRScannerIsDisplayed: false,
    showQRScanner: true,
    stationsVisited: [],
    tags: [],
    timers: {},
    // onLevel: 0,
    helpAvailable: 3,
  },
  audio: {
    volume: 0,
    story: {
      isPlaying: false,
      // data: {},
      data: null,
    },
    background: {
      isPlaying: false,
      // data: {},
      data: null,
    },
  },
};

export const store = createStore({
  //state: {},
  state: initialState,
  mutations: {
    decreaseHelpAvailable(state) {
      state.user.helpAvailable--;
    },

    displayQRScanner(state) {
      state.user.QRScannerIsDisplayed = true;
    },

    hideQRScanner(state) {
      state.user.QRScannerIsDisplayed = false;
    },

    displayButtonToOpenQRScanner(state) {
      state.user.QRScannerCanBeDisplayed = true;
    },

    hideButtonToOpenQRScanner(state) {
      state.user.QRScannerCanBeDisplayed = false;
    },

    pushStationIdToStationsVisited(state, stationId) {
      state.user.stationsVisited.push(stationId);
    },

    addTimer(state, payLoad: { timerName: string; timer: number }) {
      state.user.timers[payLoad.timerName] = payLoad.timer;
    },

    removeTimer(state, timerName: string) {
      delete state.user.timers[timerName];
    },

    setAudioStoryIsPlaying(state, value: boolean) {
      state.audio.story.isPlaying = value;
    },

    setAudioBackgroundIsPlaying(state, value: boolean) {
      state.audio.background.isPlaying = value;
    },

    async loadGameConfig(state) {
      const urlParams = new URLSearchParams(window.location.search);
      const configUrl = urlParams.get("configUrl");

      if (configUrl) {
        state.gameConfig = await loadGameConfig(new URL(configUrl));
        state.gameConfigLoaded = true;
        console.log("gameConfigLoaded");
      }
    },

    wipeHistory(state) {
      state.user = initialState.user;
      state.audio = initialState.audio;
      state.dummyCounter = initialState.dummyCounter;
    },
  },
  actions: {},
  modules: {},
  plugins: [createPersistedState()],
});

// const storeClosure = store;
store.subscribe((mutation, state) => {
  console.log("mutation type: ", mutation.type);
  console.log("mutation payload: ", mutation.payload);

  const timersExists = Object.keys(state.user.timers).length !== 0;

  const audioIsPlaying =
    state.audio.story.isPlaying || state.audio.background.isPlaying;
  const qrScannerVisible = state.user.QRScannerIsDisplayed;
  const openQrScannerButtonVisible = state.user.QRScannerCanBeDisplayed;
  console.log("button visible ", openQrScannerButtonVisible);

  if (
    !timersExists &&
    !audioIsPlaying &&
    !qrScannerVisible &&
    !openQrScannerButtonVisible
  ) {
    console.log("Please display the show qr scanner button");
    store.commit(Mutations.displayButtonToOpenQRScanner);
  }

  if (timersExists || audioIsPlaying) {
    // Hide qrScanner and button to open qrScanner
    console.log(" Hide qrScanner and button to open qrScanner");
    if (state.user.QRScannerIsDisplayed) {
      store.commit(Mutations.hideQRScanner);
    }
    if (state.user.QRScannerCanBeDisplayed) {
      store.commit(Mutations.hideButtonToOpenQRScanner);
    }
  }
});

export enum Mutations {
  decreaseHelpAvailable = "decreaseHelpAvailable",
  displayQRScanner = "displayQRScanner",
  hideQRScanner = "hideQRScanner",
  displayButtonToOpenQRScanner = "displayButtonToOpenQRScanner",
  hideButtonToOpenQRScanner = "hideButtonToOpenQRScanner",
  wipeHistory = "wipeHistory",
  loadGameConfig = "loadGameConfig",
  pushStationIdToStationsVisited = "pushStationIdToStationsVisited",
  addTimer = "addTimer",
  removeTimer = "removeTimer",
  setAudioStoryIsPlaying = "setAudioStoryIsPlaying",
  setAudioBackgroundIsPlaying = "setAudioBackgroundIsPlaying",
}
