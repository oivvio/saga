// import Alpine from "alpinejs";

// const STATE = "state";

// interface IUserState {
//   QRScannerCanBeDisplayed: boolean;
//   QRScannerIsDisplayed: boolean;
//   showQRScanner: boolean;
//   // showQRScanner: true,
//   stationsVisited: string[];
//   tags: string[];
//   timers: string[];
//   //onLevel: 0,
//   helpAvailable: number;
// }

// export interface IState {
//   dummyCounter: number;
//   user: IUserState;
//   audio: {
//     volume: number;
//     story: {
//       isPlaying: boolean;
//       data: string | null;
//     };
//     background: {
//       isPlaying: boolean;
//       data: string | null;
//     };
//   };
// }

// const initialState: IState = {
//   dummyCounter: 1,
//   user: {
//     QRScannerCanBeDisplayed: true,
//     QRScannerIsDisplayed: false,
//     showQRScanner: true,
//     stationsVisited: [],
//     tags: [],
//     timers: [],
//     // onLevel: 0,
//     helpAvailable: 3,
//   },
//   audio: {
//     volume: 0,
//     story: {
//       isPlaying: false,
//       // data: {},
//       data: null,
//     },
//     background: {
//       isPlaying: false,
//       // data: {},
//       data: null,
//     },
//   },
//   // fakeId: "play-timer-1",
// };

// const STATEKEYS = ["dummyCounter", "user", "audio", "fakeId"];
//let STATEKEYS = ["dummyCounter", "user", "fakeId"];

export const stations = {};
// Pick up stored Alpine.store state from localStorage or null if none exists.
// export function getStateFromLocalStorage(): IState | null {
//   // Get the serialized data

//   const serializedState = localStorage.getItem(STATE);

//   if (serializedState !== null) {
//     // Put it in an Alpine store
//     Alpine.store(STATE, JSON.parse(serializedState));

//     // Return that store
//     return Alpine.store(STATE);
//   } else {
//     // Or null if nothing was on disk
//     return null;
//   }
// }

// // Put state into localStorage
// function saveStateToLocalStorage(state: IState) {
//   try {
//     // state is an Alpine.store that can not be serialized,
//     // so we must extract the parts we care about into a simple
//     // object
//     const stateCopy = {};
//     STATEKEYS.forEach((key) => {
//       stateCopy[key] = state[key];
//     });
//     const serializedState = JSON.stringify(stateCopy);
//     localStorage.setItem(STATE, serializedState);
//   } catch (error) {
//     console.log(state);
//     // debugger;
//   }
// }

// Run once, on app startup, return an Alpine.store
// export function initializeState(): IState {
//   // Try to get persisted state
//   // let state = getStateFromLocalStorage();
//   // console.log("state from localStorage: ", state);
//   const state = null;
//   // If that was successful, return it
//   if (state !== null) {
//     return state;
//   } else {
//     // Otherwise create a brand new Alpine state
//     Alpine.store(STATE, initialState);

//     // Put the same thing in localStorage
//     saveStateToLocalStorage(initialState);

//     // And return it.
//     console.log(Alpine.store(STATE));
//     return Alpine.store(STATE);
//   }
// }

// This is what we usually call to get the current state.
// That is, when we don't think that we need to read from disk
// export function getState(): IState {
//   return Alpine.store(STATE);
// }

// All state altering functions are defined below. And follow the pattern of our increaseDummyCounter function

// export function increaseDummyCounter(num: number): void {
//   // Get our current state
//   const state = Alpine.store(STATE);

//   // Do our changes
//   state.dummyCounter += num;

//   // Save the new state to disk
//   saveStateToLocalStorage(state);
// }

// export function decreaseHelpAvailable(): void {
//   // Get our current state
//   const state = Alpine.store(STATE);

//   // Do our changes
//   state.user.helpAvailable--;

//   // Save the new state to disk
//   saveStateToLocalStorage(state);
// }
