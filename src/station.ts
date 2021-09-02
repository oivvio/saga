// Interpret stations

import { playAudio, tryStory } from "./main";
import { stations, IState } from "./state";

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
  audioFilename: string;
  timerName: string;
  cancelOnLeave: boolean;
  timeLimit: number;
  goToStation: string;
  toStation: string;
  condition?: "hasTag";
  conditionArgs: string;
  // onTimeLimitEnd: () => {};
  onTimeLimitEnd: ISecondLevelTrigger;
}

export interface ISecondLevelTrigger {
  action: "playAudio" | "startTimeLimit" | "goToStation" | "cancelTimer";
  audioFilename: string;
  timerName: string;
  cancelOnLeave: boolean;
  timeLimit: number;
  goToStation: string;
  toStation: string;
  condition?: "hasTag";
  conditionArgs: string;
}

// Trigger actions
const triggers = {
  playAudio: function (_: IState, trigger: ITrigger) {
    //playAudio(trigger.audioFilename, trigger.audioType); TSFIXES
    playAudio(trigger.audioFilename);
  },
  startTimeLimit: function (state: IState, trigger: ITrigger) {
    const timer = window.setTimeout(function () {
      interpretSecondLevelTrigger(state, trigger.onTimeLimitEnd);
    }, trigger.timeLimit * 1000);
    state.user.timers[trigger.timerName] = timer;
  },
  goToStation: function (_: IState, trigger: ITrigger) {
    tryStory(trigger.toStation);
  },
  cancelTimer: function (state: IState, trigger: ITrigger) {
    const timer = state.user.timers[trigger.timerName];
    if (timer !== undefined) {
      window.clearTimeout(timer);
      state.user.timers[trigger.timerName] = "cancelled";
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
  if (trigger.condition === undefined) {
    return true;
  } else {
    return conditions[trigger.condition](state, trigger.conditionArgs);
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
    if (trigger.cancelOnLeave && state.user.timers[trigger.timerName]) {
      const timer = state.user.timers[trigger.timerName];
      window.clearTimeout(timer);
      //state.user.timers[trigger.timerName] = "cancelled";

      console.log("cancel timer:", trigger.timerName);
      delete state.user.timers[trigger.timerName];
    }
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

      const leavingStationId =
        state.user.stationsVisited[state.user.stationsVisited.length - 1];
      const leavingStation = stations[leavingStationId];
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
