// eslint-disable-next-line
import { ComponentCustomProperties } from "vue";
import { Store, createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";
import { IGameConfig } from "../station";
import { loadGameConfig } from "../station";

interface IUserState {
  QRScannerCanBeDisplayed: boolean;
  QRScannerIsDisplayed: boolean;
  showQRScanner: boolean;
  // stationsVisited: string[];
  stationsVisited: Set<string>;
  lastStationVisitedId?: string;
  // tags: string[];
  tags: Set<string>;
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
    stationsVisited: new Set([]),
    tags: new Set([]),
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
  // fakeId: "play-timer-1",
};

export const store = createStore({
  //state: {},
  state: initialState,
  mutations: {
    incrementDummyCounter(state) {
      state.dummyCounter++;
    },
    decrementDummyCounter(state) {
      state.dummyCounter--;
    },

    decreaseHelpAvailable(state) {
      state.user.helpAvailable--;
    },

    displayQRScanner(state) {
      state.user.QRScannerIsDisplayed = true;
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

export enum Mutations {
  incrementDummyCounter = "incrementDummyCounter",
  decrementDummyCounter = "decrementDummyCounter",
  decreaseHelpAvailable = "decreaseHelpAvailable",
  displayQRScanner = "displayQRScanner",
  wipeHistory = "wipeHistory",
  loadGameConfig = "loadGameConfig",
}
