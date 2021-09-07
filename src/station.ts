// Interpret stations

import { playAudio, tryStory } from "./engine";
// import { stations, IState } from "./state";
import { IState } from "./store";
import { getParentUrl, getChildUrl } from "./utils";

// TODO flesh this out
// Keep this in sync with the json schema
export interface IStation {
  id: string;
  type: "station" | "help";
  description: string;
  tags: string[];
  triggers: ITrigger[];
}

export interface ITrigger {
  action: "playAudio" | "startTimeLimit" | "goToStation" | "cancelTimer";
  audioFilename?: string;
  timerName?: string;
  cancelOnLeave?: boolean;
  timeLimit?: number;
  goToStation?: string;
  toStation?: string;
  condition?: "hasTag";
  conditionArgs?: string;
  // onTimeLimitEnd: () => {};
  onTimeLimitEnd?: ISecondLevelTrigger;
}

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

// TODO This should be loaded from game config not hard coded
export const stations: Record<string, IStation> = {
  "play-timer-1": {
    id: "play-timer-1",
    type: "station",
    description:
      "play audio. starts a level timer that wont end until leaving level 1.",
    tags: ["play-timer-1"],
    triggers: [
      {
        action: "playAudio",
        audioFilename: "audio-test-1.mp3",
      },
      {
        action: "startTimeLimit",
        timerName: "timer-help-1",
        cancelOnLeave: true,
        timeLimit: 5,
        onTimeLimitEnd: {
          action: "playAudio",
          audioFilename: "timerhelp-test-1.mp3",
        },
      },
      {
        action: "startTimeLimit",
        timerName: "timer-story-1-2",
        cancelOnLeave: true,
        timeLimit: 10,
        onTimeLimitEnd: {
          action: "goToStation",
          toStation: "play-timer-2",
        },
      },
    ],
  },
};

interface IGameConfig {
  name: string;
  stationPaths: string[];
  // stationsList: IStation[];
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
const triggers = {
  playAudio: function (_: IState, trigger: ITrigger) {
    trigger.audioFilename && playAudio(trigger.audioFilename);
  },
  startTimeLimit: function (state: IState, trigger: ITrigger) {
    if (trigger.onTimeLimitEnd && trigger.timeLimit && trigger.timerName) {
      const timer = window.setTimeout(function () {
        trigger.onTimeLimitEnd &&
          interpretSecondLevelTrigger(state, trigger.onTimeLimitEnd);
      }, trigger.timeLimit * 1000) as number;
      state.user.timers[trigger.timerName] = timer;
    }
  },
  goToStation: function (_: IState, trigger: ITrigger) {
    trigger.toStation && tryStory(trigger.toStation);
  },
  cancelTimer: function (state: IState, trigger: ITrigger) {
    if (trigger.timerName) {
      const timer = state.user.timers[trigger.timerName];
      if (timer !== undefined) {
        window.clearTimeout(timer);
        delete state.user.timers[trigger.timerName];
      }
    }
  },
};

function interpretTrigger(state: IState, trigger: ITrigger) {
  if (trigger.action !== undefined) {
    if (triggers[trigger.action] === undefined) {
      console.warn("Trigger not implemented", trigger.action);
    } else {
      triggers[trigger.action](state, trigger);
    }
  }
}

function interpretSecondLevelTrigger(
  state: IState,
  trigger: ISecondLevelTrigger
) {
  if (trigger.action !== undefined) {
    if (triggers[trigger.action] === undefined) {
      console.warn("Trigger not implemented", trigger.action);
    } else {
      triggers[trigger.action](state, trigger as ITrigger);
    }
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
  if (trigger.condition && trigger.conditionArgs) {
    return conditions[trigger.condition](state, trigger.conditionArgs);
  } else {
    return true;
  }
}

function triggerOnLeave(state: IState, trigger: ITrigger): void {
  if (trigger.action !== undefined) {
    if (onLeave[trigger.action] !== undefined) {
      onLeave[trigger.action](state, trigger);
    }
  }
}

const onLeave = {
  startTimeLimit: function (state: IState, trigger: ITrigger): void {
    if (
      trigger.cancelOnLeave &&
      trigger.timerName &&
      state.user.timers[trigger.timerName]
    ) {
      const timer = state.user.timers[trigger.timerName];
      window.clearTimeout(timer);
      //state.user.timers[trigger.timerName] = "cancelled";

      console.log("cancel timer:", trigger.timerName);
      delete state.user.timers[trigger.timerName];
    }
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

//
export function interpretStation(state: IState, station: IStation): void {
  switch (station.type) {
    case "help":
      console.log("station  type help");
      break;
    case "station": {
      console.log("station type station");

      // Pick up the station the user just left, if any.

      const leavingStationId: string =
        state.user.stationsVisited[state.user.stationsVisited.length - 1];
      const leavingStation: IStation = stations[leavingStationId];
      console.log("leavingStation: ", leavingStationId);

      // Handle triggers for the station the user just left
      if (leavingStation !== undefined) {
        leavingStation.triggers.forEach((trigger) => {
          triggerOnLeave(state, trigger);
        });
      }

      // Handle triggers for the users current station
      station.triggers.forEach((trigger) => {
        console.log("trigger: ", trigger);
        if (trigger === undefined) {
          console.log("");
          // debugger;
        }
        if (interpretCondition(state, trigger)) {
          interpretTrigger(state, trigger);
        }
      });

      // Add station.id to visited stations
      if (!state.user.stationsVisited.includes(station.id)) {
        state.user.stationsVisited.push(station.id);
      }

      // Add tags from this station to users list of visited tags
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
