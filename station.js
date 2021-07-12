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
};

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

let onLeave = {
  startTimeLimit: function (state, trigger) {
    if (trigger.cancelOnLeave && state.user.timers[trigger.timerName]) {
      let timer = state.user.timers[trigger.timerName];
      window.clearTimeout(timer);
      state.user.timers[trigger.timerName] = "cancelled";
    }
  },
};

function interpretTrigger(state, trigger) {
  if (trigger.action !== undefined) {
    if (triggers[trigger.action] === undefined) {
      console.warn("Trigger not implemented", trigger.action);
    }
    triggers[trigger.action](state, trigger);
  }
}

function interpretCondition(state, trigger) {
  if (trigger.condition === undefined) {
    return true;
  } else {
    if (trigger.condition !== undefined) {
      return conditions[trigger.condition](state, trigger.conditionArgs);
    } else {
      console.warn("Condition not implementet", trigger.condition);
      return false;
    }
  }
}

function triggerOnLeave(state, trigger) {
  if (trigger.action !== undefined) {
    if (onLeave[trigger.action]) {
      onLeave[trigger.action](state, trigger);
    }
  }
}

let stationLogic = {
  getTags(user) {},
  interpretStation(state, station) {
    let leavingStation =
      state.user.stationsVisited[state.user.stationsVisited.length - 1];
    if (leavingStation !== undefined) {
      leavingStation.triggers.forEach((trigger) => {
        triggerOnLeave(state, trigger);
      });
    }

    station.triggers.forEach((trigger) => {
      if (interpretCondition(state, trigger)) {
        interpretTrigger(state, trigger);
      }
    });
    state.user.stationsVisited.push(station);
  },
};

window.Station = stationLogic;
