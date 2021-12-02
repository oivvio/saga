// eslint-disable-next-line

import { has } from "lodash";

// eslint-disable-next-line
import { ComponentCustomProperties } from "vue";

// eslint-disable-next-line
import createPersistedState from "vuex-persistedstate";

import { Store, createStore } from "vuex";
import { IGameConfig, StationID, Station } from "../station";
import { loadGameConfigAndStations } from "../station";

interface IUserState {
  QRScannerCanBeDisplayed: boolean;
  QRScannerIsDisplayed: boolean;
  showQRScanner: boolean;
  stationsVisited: StationID[];
  stationVisitCounts: Record<StationID, { open: number; closed: number }>;
  lastStationVisitedId?: StationID;
  // timers: Record<string, number>;
  timers: Record<string, number>;
  helpAvailable: number;
  currentStation: StationID | undefined;
  openStations: StationID[];
  playedHelpTracks: Record<StationID, string[]>;

  // eslint-disable-next-line
  adHocData: Record<string, any>;
  tags: string[];
  hasPlayedTutorial: boolean;
}

export interface IState {
  gameConfigLoaded: boolean;
  gameConfig?: IGameConfig;

  debugDisplayDevBox: boolean;
  debugQuickAudio: boolean;

  user: IUserState;
  audio: {
    volume: number;
    foreground: {
      isPlaying: boolean;
      audioFilename: string | null;
    };
    background: {
      isPlaying: boolean;
      data: string | null;
    };

    playedForegroundAudio: string[];
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
  gameConfigLoaded: false,
  gameConfig: undefined,
  debugDisplayDevBox: false,
  debugQuickAudio: false,

  user: {
    QRScannerCanBeDisplayed: false,
    QRScannerIsDisplayed: false,
    showQRScanner: true,
    stationsVisited: [],
    stationVisitCounts: {} as Record<
      StationID,
      { open: number; closed: number }
    >,
    //     tags: [],
    timers: {},
    // onLevel: 0,
    helpAvailable: 3,
    currentStation: undefined,
    openStations: [],
    playedHelpTracks: {} as Record<StationID, string[]>,
    // eslint-disable-next-line
    adHocData: {} as Record<string, any>,
    tags: [],
    hasPlayedTutorial: false,
  },
  audio: {
    volume: 0,
    foreground: {
      isPlaying: false,
      audioFilename: null,
    },
    background: {
      isPlaying: false,
      data: null,
    },

    playedForegroundAudio: [],
  },
};

function urlRemoveReset(url: Location) {
  const search = url.search
    .split("&")
    .map((part) => {
      if (part.charAt(0) === "?") {
        return part.substring(1);
      } else {
        return part;
      }
    })
    .filter((part) => part !== "reset=yes")
    .join("&");

  return new URL(url.origin + url.pathname + "?" + search);
}

export const store = createStore({
  state: initialState,
  mutations: {
    decreaseHelpAvailable(state: IState) {
      state.user.helpAvailable--;
    },

    displayQRScanner(state: IState) {
      state.user.QRScannerIsDisplayed = true;
    },

    hideQRScanner(state: IState) {
      state.user.QRScannerIsDisplayed = false;
    },

    displayButtonToOpenQRScanner(state: IState) {
      state.user.QRScannerCanBeDisplayed = true;
    },

    hideButtonToOpenQRScanner(state: IState) {
      state.user.QRScannerCanBeDisplayed = false;
    },

    pushStationIdToStationsVisited(state: IState, stationId: StationID) {
      const status = state.user.openStations.includes(stationId)
        ? "open"
        : "closed";

      // Only push to stationsVisisited if the current station is "open".
      // i.e. scanning a closed station dosen't count as a regular visit.
      if (status === "open") {
        state.user.stationsVisited.push(stationId);
      }

      // But we want to keep track of the times closed stations have been scanned as well
      // because that's have we decide what help file to play

      // Get the station visit count
      let stationVisitCountEntry = state.user.stationVisitCounts[stationId];

      // Add to the state if doesn't exist
      if (!stationVisitCountEntry) {
        stationVisitCountEntry = { open: 0, closed: 0 };
        state.user.stationVisitCounts[stationId] = stationVisitCountEntry;
      }

      // Bump the count
      stationVisitCountEntry[status]++;
    },

    addTimer(state: IState, payLoad: { timerName: string; timer: number }) {
      state.user.timers[payLoad.timerName] = payLoad.timer;
    },

    removeTimer(state: IState, timerName: string) {
      delete state.user.timers[timerName];
    },

    setForegroundAudioIsPlaying(state: IState, value: boolean) {
      state.audio.foreground.isPlaying = value;
    },

    setAudioBackgroundIsPlaying(state: IState, value: boolean) {
      state.audio.background.isPlaying = value;
    },

    setCurrentAudioFilename(state: IState, audioFilename: string) {
      state.audio.foreground.audioFilename = audioFilename;
    },

    pushToPlayedForegroundAudio(state: IState, audioFilename: string) {
      state.audio.playedForegroundAudio.push(audioFilename);
    },

    async loadGameConfig(state: IState) {
      const urlParams = new URLSearchParams(window.location.search);
      const configUrl = urlParams.get("configUrl");

      const resetGame = urlParams.get("reset") === "yes";
      if (resetGame) {
        store.commit(Mutations.wipeHistory);
        const redirectUrl = urlRemoveReset(window.location);
        window.location.replace(redirectUrl.toString());
      }

      state.debugDisplayDevBox = urlParams.get("displayDevBox") === "yes";
      state.debugQuickAudio = urlParams.get("quickAudio") === "yes";

      if (configUrl) {
        // If gameConfig is already loaded it was picked up in persistance
        // and we don't need to do any initialization
        if (!state.gameConfigLoaded) {
          state.gameConfig = await loadGameConfigAndStations(
            new URL(configUrl)
          );
          store.commit(
            Mutations.updateOpenStations,
            state.gameConfig.openStationsAtStart
          );
          state.gameConfigLoaded = true;
        }
      }
    },

    wipeHistory(state: IState) {
      state.user = initialState.user;
      state.audio = initialState.audio;
      state.gameConfigLoaded = false;
    },

    setCurrentStation(state: IState, stationId: StationID) {
      state.user.currentStation = stationId;
    },

    updateOpenStations(state: IState, stationIds: StationID[]) {
      state.user.openStations = stationIds;
    },

    pushPlayedHelpTrack(
      state: IState,
      payload: { audioFilename: string; currentStation: Station }
    ) {
      if (!has(state.user.playedHelpTracks, payload.currentStation.id)) {
        state.user.playedHelpTracks[payload.currentStation.id] = [];
      }

      state.user.playedHelpTracks[payload.currentStation.id].push(
        payload.audioFilename
      );
    },

    // eslint-disable-next-line
    setAdHocData(state: IState, payload: { key: string; value: any }) {
      state.user.adHocData[payload.key] = payload.value;
    },

    // eslint-disable-next-line
    pushToAdHocArray(state: IState, payload: { key: string; value: any }) {
      if (state.user.adHocData[payload.key] === undefined) {
        state.user.adHocData[payload.key] = [];
      }
      state.user.adHocData[payload.key].push(payload.value);
    },

    setLastStationVisitedId(state: IState, stationId: StationID) {
      state.user.lastStationVisitedId = stationId;
    },

    completeTutorial(state: IState) {
      state.user.hasPlayedTutorial = true;
    },

    pushTags(state: IState, tags: string[]) {
      tags.forEach((tag) => {
        if (!state.user.tags.includes(tag)) {
          state.user.tags.push(tag);
        }
      });
    },
  },
  actions: {},
  modules: {},
  plugins: [createPersistedState()],
});

// const storeClosure = store;
// store.subscribe((mutation, state: IState) => {
store.subscribe((_, state: IState) => {
  const audioIsPlaying = state.audio.foreground.isPlaying;
  const qrScannerVisible = state.user.QRScannerIsDisplayed;
  const openQrScannerButtonVisible = state.user.QRScannerCanBeDisplayed;
  if (!audioIsPlaying && !qrScannerVisible && !openQrScannerButtonVisible) {
    store.commit(Mutations.displayButtonToOpenQRScanner);
  }

  if (audioIsPlaying) {
    // Hide qrScanner and button to open qrScanner
    if (state.user.QRScannerIsDisplayed) {
      store.commit(Mutations.hideQRScanner);
    }
    if (state.user.QRScannerCanBeDisplayed) {
      store.commit(Mutations.hideButtonToOpenQRScanner);
    }
  }
});

// We use an enum for our commits to bring some semblance of
// sanity to this stringly typed API
//
// TODO There are better ways of doing this
// https://dev.to/3vilarthas/vuex-typescript-m4j
export enum Mutations {
  addTimer = "addTimer",
  decreaseHelpAvailable = "decreaseHelpAvailable",
  displayButtonToOpenQRScanner = "displayButtonToOpenQRScanner",
  displayQRScanner = "displayQRScanner",
  hideButtonToOpenQRScanner = "hideButtonToOpenQRScanner",
  hideQRScanner = "hideQRScanner",
  loadGameConfig = "loadGameConfig",
  pushPlayedHelpTrack = "pushPlayedHelpTrack",
  pushStationIdToStationsVisited = "pushStationIdToStationsVisited",
  pushToAdHocArray = "pushToAdHocArray",
  removeTimer = "removeTimer",
  setAdHocData = "setAdHocData",
  setAudioBackgroundIsPlaying = "setAudioBackgroundIsPlaying",
  pushToPlayedForegroundAudio = "pushToPlayedForegroundAudio",
  setCurrentStation = "setCurrentStation",
  setForegroundAudioIsPlaying = "setForegroundAudioIsPlaying",
  setCurrentAudioFilename = "setCurrentAudioFilename",
  updateOpenStations = "updateOpenStations",
  wipeHistory = "wipeHistory",
  setLastStationVisitedId = "setLastStationVisitedId",
  pushTags = "pushTags",
  completeTutorial = "completeTutorial",
}
