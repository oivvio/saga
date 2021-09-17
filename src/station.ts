// Interpret stations
import { AudioEventHandler, runStation } from "./engine";
import { store, IState, Mutations } from "./store";
import { getParentUrl, getChildUrl, log } from "./utils";

// Keep these types in sync with our json schema
// We validate all our game definition json files so we can be fully confident that
// our data conforms to our types
//
// type StationID = string;

// https://basarat.gitbook.io/typescript/main-1/nominaltyping
export interface IStationID_ extends String {
  _stationIdBrand: string; // To prevent type errors
}

enum StationIDBrand {
  _ = "",
}
export type StationID = StationIDBrand & string;

export interface IStation {
  // id: string;
  id: StationID;
  type: "story" | "help" | "choice";
  description: string;
  tags: string[];
  opens: StationID[];
  events: IEvent[];
}

export interface IEventPlayAudio {
  action: "playAudio";
  audioFilenames: string;
}

export interface IEventPlayBackgroundAudio {
  action: "playAudio";
  audioFilename: string;
  wait: number;
  cancelOnLeave: boolean;
  loop: boolean;
}

export interface IEventStartTimeLimit {
  action: "startTimeLimit";
  timerName: string;
  cancelOnLeave: boolean;
  timeLimit: number;
  onTimeLimitEnd: ISecondLevelEvent;
}

export interface IEventGoToStation {
  action: "goToStation";
  toStation: StationID;
}

export interface IEventCancelTimer {
  action: "cancelTimer";
  timerName: string;
}

export interface IEventCondition {
  condition: "hasTag";
  conditionArgs: string;
}

export type IEventAction =
  | IEventPlayAudio
  | IEventPlayBackgroundAudio
  | IEventStartTimeLimit
  | IEventGoToStation
  | IEventCancelTimer;

export type IEvent = IEventAction | IEventCondition;

export interface ISecondLevelEvent {
  action: "playAudio" | "startTimeLimit" | "goToStation" | "cancelTimer";
  audioFilename?: string;
  timerName?: string;
  cancelOnLeave?: boolean;
  timeLimit?: number;
  goToStation?: string;
  toStation?: string;
  condition?: "hasTag";
  conditionArgs?: string;
}

export interface IGameConfig {
  name: string;
  baseUrl: string;
  stationPaths: string[];
  stations: Record<StationID, IStation>;
  choiceInfix: string;
  openStationsAtStart: StationID[];
  audioFileUrlBase: string;
}

// load a game configuration from a given URL,
// mostly this will load a bunch of stations files
export async function loadGameConfigAndStations(
  configUrl: URL
): Promise<IGameConfig> {
  log("station", `in loadGameConfigAndStations ${configUrl}`);
  //
  // (http://example.com/parent, "./child/station1.json") -> data
  async function loadStationFromPath(
    baseUrl: URL,
    path: string
  ): Promise<IStation> {
    const fullUrl = getChildUrl(baseUrl, path);
    return fetch(fullUrl.toString()).then((response) => response.json());
  }

  return fetch(configUrl.toString())
    .then((response) => response.json())
    .then(async (gameConfig: IGameConfig) => {
      // extract baseURL from our configUrl
      const baseUrl = getParentUrl(configUrl);
      // Make a set of promises for fetching all stations
      const stationPromises = gameConfig.stationPaths.map((path) => {
        return loadStationFromPath(baseUrl, path);
      });

      // fetch the stations
      const stations = await Promise.all(stationPromises);

      // Put them into the data structure
      stations.forEach((station) => {
        gameConfig.stations[station.id] = station;
      });

      return gameConfig;
    });
}

// Events
// this object serves as lookup function for our
const eventHandlers = {
  playAudio: function (_: IState, event: IEvent) {
    const playAudioEvent = event as IEventPlayAudio;

    // TODO, figure out which audioFile to play
    // const audioFile = playAudioEvent.audioFilenames[0];
    // playAudioFile(audioFile, false);
    const audioEventHandler = AudioEventHandler.getInstance();
    audioEventHandler.handlePlayAudioEvent(playAudioEvent);
  },

  playBackgroundAudio: function (_: IState, event: IEvent) {
    const playBackgroundAudioEvent = event as IEventPlayBackgroundAudio;
    const audioEventHandler = AudioEventHandler.getInstance();
    audioEventHandler.handlePlayBackgroundAudioEvent(playBackgroundAudioEvent);
  },

  startTimeLimit: function (state: IState, event: IEvent) {
    const startTimeLimitEvent = event as IEventStartTimeLimit;
    const timer = window.setTimeout(function () {
      if (startTimeLimitEvent.timerName) {
        store.commit(Mutations.removeTimer, startTimeLimitEvent.timerName);
      }

      startTimeLimitEvent.onTimeLimitEnd &&
        interpretSecondLevelEvent(state, startTimeLimitEvent.onTimeLimitEnd);
    }, startTimeLimitEvent.timeLimit * 1000) as number;
    if (timer) {
      const timerName = startTimeLimitEvent.timerName;
      store.commit(Mutations.addTimer, { timerName, timer });
    }
  },

  goToStation: function (_: IState, event: IEvent) {
    const goToStationEvent = event as IEventGoToStation;
    runStation(goToStationEvent.toStation);
  },

  cancelTimer: function (state: IState, event: IEvent) {
    const cancelTimerEvent = event as IEventCancelTimer;
    if (cancelTimerEvent.timerName) {
      const timer = state.user.timers[cancelTimerEvent.timerName];
      if (timer !== undefined) {
        window.clearTimeout(timer);
        store.commit(Mutations.removeTimer, cancelTimerEvent.timerName);
      }
    }
  },
};

function interpretEvent(state: IState, inEvent: IEvent) {
  const event = inEvent as IEventAction;
  eventHandlers[event.action](state, event);
}

function interpretSecondLevelEvent(state: IState, event: ISecondLevelEvent) {
  if (event.action !== undefined) {
    eventHandlers[event.action](state, event as IEvent);
  }
}

// Used in interpretCondition
const conditions = {
  hasTag: function (state: IState, tag: string) {
    return state.user.tags.includes(tag);
  },
};

// Takes a state a and event.
// If event has no condition return true.
// If event has a condition, pick it up and evaluate it, return result.
function interpretCondition(state: IState, event: IEvent): boolean {
  const conditionEvent = event as IEventCondition;
  if (conditionEvent.condition && conditionEvent.conditionArgs) {
    return conditions[conditionEvent.condition](
      state,
      conditionEvent.conditionArgs
    );
  } else {
    return true;
  }
}

function runEventOnLeave(state: IState, event: IEvent): void {
  const actionEvent = event as IEventAction;
  if (onLeave[actionEvent.action] !== undefined) {
    onLeave[actionEvent.action](state, actionEvent);
  }
}

const onLeave = {
  startTimeLimit: function (state: IState, event: IEvent): void {
    const startTimeLimitEvent = event as IEventStartTimeLimit;

    const timer = state.user.timers[startTimeLimitEvent.timerName];
    window.clearTimeout(timer);

    store.commit(Mutations.removeTimer, startTimeLimitEvent.timerName);
  },

  // required by TypeScript because of how IEvent.action is defined
  // eslint-disable-next-line
  playAudio: () => {},
  // eslint-disable-next-line
  goToStation: () => {},
  // eslint-disable-next-line
  cancelTimer: () => {},
};

export function interpretStation(state: IState, station: IStation): void {
  // For any station, check if there is any background audio running that should be stopped
  const audioEventHandler = AudioEventHandler.getInstance();
  audioEventHandler.cancelDueBackgroundSounds();

  const stationIsOpen = state.user.openStations.includes(station.id);

  if (stationIsOpen) {
    // User scanned an open station
    switch (station.type) {
      case "help":
        console.log("HELP STATIONS ARE NOT YET IMPLEMENTED");
        break;

      case "choice":
      case "story": {
        // Pick up the station the user just left, if any.
        if (state.user.lastStationVisitedId !== undefined) {
          const leavingStation =
            state.gameConfig?.stations[state.user.lastStationVisitedId];
          if (leavingStation !== undefined) {
            log(
              "interpretStation",
              `leavingStationId: ${state.user.lastStationVisitedId}`
            );
            // Handle events for the station the user just left
            if (leavingStation !== undefined) {
              leavingStation.events.forEach((event) => {
                runEventOnLeave(state, event);
              });
            }
          }
        }

        // Handle events for the users current station
        station.events.forEach((event) => {
          log(
            "interpretStation",
            `handle events for users current station  ${event}`
          );
          if (interpretCondition(state, event)) {
            interpretEvent(state, event);
          }
        });

        log(
          "interpretStation",
          `post handle events ${state.user.stationsVisited}`
        );

        // Add station.id to users set of visited stations
        if (!state.user.stationsVisited.includes(station.id)) {
          log("interpretStation", `push stationid: ${station.id}`);
          store.commit(Mutations.pushStationIdToStationsVisited, station.id);
        }

        // Set users last visited station
        state.user.lastStationVisitedId = station.id;

        // Add tags from this station to users set of visited tags
        station.tags.forEach((tag: string) => {
          if (!state.user.tags.includes(tag)) {
            state.user.tags.push(tag);
          }
        });

        // Open next stations, close previous
        if (station.opens !== undefined && state.gameConfig) {
          log("station", `interpretStation ${station.opens}`);
          store.commit(Mutations.updateOpenStations, station.opens);
        }
        break;
      }

      default:
        // TODO log to sentry
        break;
    }
  } else {
    // User scanned a closed station
    console.log("YOU'VE SCANNED A CLOSED STATION");
    switch (station.type) {
      case "help":
        console.log("HELP STATIONS ARE NOT YET IMPLEMENTED");
        break;

      case "choice":
      case "story":
        break;

      default:
        // TODO log to sentry
        break;
    }
  }
}
