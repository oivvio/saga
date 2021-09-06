import { createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";
const initialState = {
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
export var Mutations;
(function (Mutations) {
    Mutations["incrementDummyCounter"] = "incrementDummyCounter";
    Mutations["decrementDummyCounter"] = "decrementDummyCounter";
    Mutations["decreaseHelpAvailable"] = "decreaseHelpAvailable";
})(Mutations || (Mutations = {}));
//# sourceMappingURL=index.js.map