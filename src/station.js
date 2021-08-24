// Interpret stations

// Trigger actions
let triggers = {
  playAudio: function (state, trigger) {
    state.playAudio(trigger.audioFilename, trigger.audioType);
  },
  startTimeLimit: function (state, trigger) {
    let timer = window.setTimeout(function () {
      interpretTrigger(state, trigger.timeLimitEnd);
    }, trigger.timeLimit * 1000);
    state.user.timers[trigger.timerName] = timer;
  },
  goToStation: function (state, trigger) {
    state.tryStory(trigger.toStation);
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

function interpretCondition(state, trigger) {
  if (trigger.condition === undefined) {
    return true;
  } else {
    return conditions[trigger.condition](state, trigger.conditionArgs);
  }
}

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

export function interpretStation(state, station) {
  switch (station.stationType) {
    case "help":
      break;
    case "station":
      // The station the user just left
      let leavingStation =
        state.user.stationsVisited[state.user.stationsVisited.length - 1];

      // Handle triggers for the station the user just left
      if (leavingStation !== undefined) {
        leavingStation.triggers.forEach((trigger) => {
          triggerOnLeave(state, trigger);
        });
      }

      // Handle triggers for the users current station
      station.triggers.forEach((trigger) => {
        if (interpretCondition(state, trigger)) {
          interpretTrigger(state, trigger);
        }
      });

      // Add station to visited stations
      state.user.stationsVisited.push(station);

      // Add tags from this station to users list of visited tags
      station.tags.forEach((tag) => {
        if (!state.user.tags.includes(tag)) {
          state.user.tags.push(tag);
        }
      });

      break;
    default:
      break;
  }
}
