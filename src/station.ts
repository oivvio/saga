// Interpret stations

import { playAudio, runStation } from "./engine";
import { store, IState, Mutations } from "./store";
import { getParentUrl, getChildUrl } from "./utils";

import { log } from "./utils";

// Keep these types in sync with our json schema
// We validate all our game definition json files so we can be fully confident that
// our data conforms to our types
export interface IStation {
  id: string;
  type: "station" | "help";
  description: string;
  tags: string[];
  events: IEvent[];
}

export interface IEventPlayAudio {
  action: "playAudio";
  audioFilename: string;
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
  toStation: string;
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
  stations: Record<string, IStation>;
}

// load a game configuration from a given URL,
// mostly this will load a bunch of stations files
export async function loadGameConfig(configUrl: URL): Promise<IGameConfig> {
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
const events = {
  playAudio: function (_: IState, event: IEvent) {
    const playAudioEvent = event as IEventPlayAudio;
    playAudio(playAudioEvent.audioFilename);
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
  events[event.action](state, event);
}

function interpretSecondLevelEvent(state: IState, event: ISecondLevelEvent) {
  if (event.action !== undefined) {
    events[event.action](state, event as IEvent);
  }
}

// Used in interpretCondition
const conditions = {
  hasTag: function (state: IState, tag: string) {
    if (state.user.tags.includes(tag)) {
      console.log("has tag", tag);
      return true;
    } else {
      console.log("no tag", tag);
      return false;
    }
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

    console.log("cancel timer:", startTimeLimitEvent.timerName);
    store.commit(Mutations.removeTimer, startTimeLimitEvent.timerName);
  },

  // required by TypeScript because of how IEvent.action is defined
  playAudio: () => {
    console.log("playAudio");
  },
  goToStation: () => {
    console.log("goToStation");
  },
  cancelTimer: () => {
    console.log("cancelTimer");
  },
};

export function interpretStation(state: IState, station: IStation): void {
  switch (station.type) {
    case "help":
      console.log("station  type help");
      break;
    case "station": {
      console.log("station type station");

      // Pick up the station the user just left, if any.
      if (state.user.lastStationVisitedId) {
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
      // state.user.stationsVisited.add(station.id);
      if (!state.user.stationsVisited.includes(station.id)) {
        log("interpretStation", `push stationid: ${station.id}`);
        log(
          "interpretStation",
          `visited before push: ${state.user.stationsVisited}`
        );
        store.commit(Mutations.pushStationIdToStationsVisited, station.id);
        log(
          "interpretStation",
          `visited after push: ${state.user.stationsVisited}`
        );
      }

      // Set users last visited station
      state.user.lastStationVisitedId = station.id;

      // Add tags from this station to users set of visited tags
      station.tags.forEach((tag: string) => {
        if (!state.user.tags.includes(tag)) {
          state.user.tags.push(tag);
        }
      });

      break;
    }
    default:
      console.log("no station type given");
      break;
  }
}
