// Interpret stations
//
import { playAudio, tryStory } from "./main";

// Trigger actions
let triggers = {
  playAudio: function (state, trigger) {
    playAudio(trigger.audioFilename, trigger.audioType);
  },
  startTimeLimit: function (state, trigger) {
    let timer = window.setTimeout(function () {
      interpretTrigger(state, trigger.timeLimitEnd);
    }, trigger.timeLimit * 1000);
    state.user.timers[trigger.timerName] = timer;
  },
  goToStation: function (state, trigger) {
    tryStory(trigger.toStation);
  },
  cancelTimer: function (state, trigger) {
    let timer = state.user.timers[trigger.timerName];
    if (timer !== undefined) {
      window.clearTimeout(timer);
      state.user.timers[trigger.timerName] = "cancelled";
    }
  },
};

function interpretTrigger(state, trigger) {
  if (trigger.action !== undefined) {
    if (triggers[trigger.action] === undefined) {
      console.warn("Trigger not implemented", trigger.action);
    } else {
      triggers[trigger.action](state, trigger);
    }
  }
}

// Used in interpretCondition
let conditions = {
  hasTag: function (state, tag) {
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
function interpretCondition(state, trigger) {
  if (trigger.condition === undefined) {
    return true;
  } else {
    return conditions[trigger.condition](state, trigger.conditionArgs);
  }
}

function triggerOnLeave(state, trigger) {
  if (trigger.action !== undefined) {
    if (onLeave[trigger.action] !== undefined) {
      onLeave[trigger.action](state, trigger);
    }
  }
}

let onLeave = {
  startTimeLimit: function (state, trigger) {
    if (trigger.cancelOnLeave && state.user.timers[trigger.timerName]) {
      let timer = state.user.timers[trigger.timerName];
      window.clearTimeout(timer);
      //state.user.timers[trigger.timerName] = "cancelled";

      console.log("cancel timer:", trigger.timerName);
      delete state.user.timers[trigger.timerName];
    }
  },
};

//
export function interpretStation(state, station) {
  switch (station.stationType) {
    case "help":
      console.log("station  type help");
      break;
    case "station":
      console.log("station type station");

      // Pick up the station the user just left, if any.

      let leavingStation =
        state.user.stationsVisited[state.user.stationsVisited.length - 1];

      console.log("leavingStation: ", leavingStation);

      // Handle triggers for the station the user just left
      if (leavingStation !== undefined) {
        leavingStation.triggers.forEach((trigger) => {
          triggerOnLeave(state, trigger);
        });
      }

      console.log("triggers: ", station.triggers);
      // Handle triggers for the users current station
      station.triggers.forEach((trigger) => {
        if (interpretCondition(state, trigger)) {
          interpretTrigger(state, trigger);
        }
      });

      // Add station.id to visited stations
      if (!state.user.stationsVisited.includes(statio.id)) {
        state.user.stationsVisited.push(station.id);
      }

      // Add tags from this station to users list of visited tags
      station.tags.forEach((tag) => {
        if (!state.user.tags.includes(tag)) {
          state.user.tags.push(tag);
        }
      });

      break;

    default:
      console.log("no station type given");
      break;
  }
}
