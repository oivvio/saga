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
  triggers: ITrigger[];
}

export interface ITriggerPlayAudio {
  action: "playAudio";
  audioFilename: string;
}

export interface ITriggerStartTimeLimit {
  action: "startTimeLimit";
  timerName: string;
  cancelOnLeave: boolean;
  timeLimit: number;
  onTimeLimitEnd: ISecondLevelTrigger;
}

export interface ITriggerGoToStation {
  action: "goToStation";
  toStation: string;
}

export interface ITriggerGoToStation {
  action: "goToStation";
  toStation: string;
}

export interface ITriggerCancelTimer {
  action: "cancelTimer";
  timerName: string;
}

export interface ITriggerCondition {
  condition: "hasTag";
  conditionArgs: string;
}

export type ITriggerAction =
  | ITriggerPlayAudio
  | ITriggerStartTimeLimit
  | ITriggerGoToStation
  | ITriggerCancelTimer;

export type ITrigger = ITriggerAction | ITriggerCondition;

export interface ISecondLevelTrigger {
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

// Trigger actions
// this object serves as lookup function for our
const triggers = {
  playAudio: function (_: IState, trigger: ITrigger) {
    const playAudioTrigger = trigger as ITriggerPlayAudio;
    playAudio(playAudioTrigger.audioFilename);
  },
  startTimeLimit: function (state: IState, trigger: ITrigger) {
    const startTimeLimitTrigger = trigger as ITriggerStartTimeLimit;
    const timer = window.setTimeout(function () {
      if (startTimeLimitTrigger.timerName) {
        store.commit(Mutations.removeTimer, startTimeLimitTrigger.timerName);
      }

      startTimeLimitTrigger.onTimeLimitEnd &&
        interpretSecondLevelTrigger(
          state,
          startTimeLimitTrigger.onTimeLimitEnd
        );
    }, startTimeLimitTrigger.timeLimit * 1000) as number;
    if (timer) {
      const timerName = startTimeLimitTrigger.timerName;
      store.commit(Mutations.addTimer, { timerName, timer });
    }

    // state.user.timers[startTimeLimitTrigger.timerName] = timer;
  },

  goToStation: function (_: IState, trigger: ITrigger) {
    const goToStationTrigger = trigger as ITriggerGoToStation;
    runStation(goToStationTrigger.toStation);
  },

  cancelTimer: function (state: IState, trigger: ITrigger) {
    const cancelTimerTrigger = trigger as ITriggerCancelTimer;
    if (cancelTimerTrigger.timerName) {
      const timer = state.user.timers[cancelTimerTrigger.timerName];
      if (timer !== undefined) {
        window.clearTimeout(timer);
        store.commit(Mutations.removeTimer, cancelTimerTrigger.timerName);
      }
    }
  },
};

function interpretTrigger(state: IState, intrigger: ITrigger) {
  const trigger = intrigger as ITriggerAction;
  triggers[trigger.action](state, trigger);
}

function interpretSecondLevelTrigger(
  state: IState,
  trigger: ISecondLevelTrigger
) {
  if (trigger.action !== undefined) {
    triggers[trigger.action](state, trigger as ITrigger);
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

// Takes a state a and trigger.
// If trigger has no condition return true.
// If trigger has a condition, pick it up and evaluate it, return result.
function interpretCondition(state: IState, trigger: ITrigger): boolean {
  const conditionTrigger = trigger as ITriggerCondition;
  if (conditionTrigger.condition && conditionTrigger.conditionArgs) {
    return conditions[conditionTrigger.condition](
      state,
      conditionTrigger.conditionArgs
    );
  } else {
    return true;
  }
}

function triggerOnLeave(state: IState, trigger: ITrigger): void {
  const actionTrigger = trigger as ITriggerAction;
  if (onLeave[actionTrigger.action] !== undefined) {
    onLeave[actionTrigger.action](state, actionTrigger);
  }
}

const onLeave = {
  startTimeLimit: function (state: IState, trigger: ITrigger): void {
    const startTimeLimitTrigger = trigger as ITriggerStartTimeLimit;

    const timer = state.user.timers[startTimeLimitTrigger.timerName];
    window.clearTimeout(timer);

    console.log("cancel timer:", startTimeLimitTrigger.timerName);
    // delete state.user.timers[startTimeLimitTrigger.timerName];
    store.commit(Mutations.removeTimer, startTimeLimitTrigger.timerName);
  },

  // required by TypeScript because of how ITrigger.action is defined
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
          // Handle triggers for the station the user just left
          if (leavingStation !== undefined) {
            leavingStation.triggers.forEach((trigger) => {
              triggerOnLeave(state, trigger);
            });
          }
        }
      }

      // Handle triggers for the users current station
      station.triggers.forEach((trigger) => {
        log(
          "interpretStation",
          `handle triggers for users current station  ${trigger}`
        );
        if (interpretCondition(state, trigger)) {
          interpretTrigger(state, trigger);
        }
      });

      log(
        "interpretStation",
        `post handle triggers ${state.user.stationsVisited}`
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
