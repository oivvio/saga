import { ComponentCustomProperties } from "vue";
import { Store, createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";

interface IUserState {
  QRScannerCanBeDisplayed: boolean;
  QRScannerIsDisplayed: boolean;
  showQRScanner: boolean;
  // showQRScanner: true,
  stationsVisited: string[];
  tags: string[];
  // timers: string[];
  timers: Record<string, number>;
  //onLevel: 0,
  helpAvailable: number;
}

export interface IState {
  dummyCounter: number;
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
  },
  actions: {},
  modules: {},
  plugins: [createPersistedState()],
});

export enum Mutations {
  incrementDummyCounter = "incrementDummyCounter",
  decrementDummyCounter = "decrementDummyCounter",
  decreaseHelpAvailable = "decreaseHelpAvailable",
}
