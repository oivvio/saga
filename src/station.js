// Interpret stations
import { playAudio, tryStory } from "./engine";
// Trigger actions
const triggers = {
    playAudio: function (_, trigger) {
        //playAudio(trigger.audioFilename, trigger.audioType); TSFIXES
        playAudio(trigger.audioFilename);
    },
    startTimeLimit: function (state, trigger) {
        const timer = window.setTimeout(function () {
            interpretSecondLevelTrigger(state, trigger.onTimeLimitEnd);
        }, trigger.timeLimit * 1000);
        console.log(timer * 1);
        state.user.timers[trigger.timerName] = timer;
    },
    goToStation: function (_, trigger) {
        tryStory(trigger.toStation);
    },
    cancelTimer: function (state, trigger) {
        const timer = state.user.timers[trigger.timerName];
        if (timer !== undefined) {
            window.clearTimeout(timer);
            delete state.user.timers[trigger.timerName];
        }
    },
};
function interpretTrigger(state, trigger) {
    if (trigger.action !== undefined) {
        if (triggers[trigger.action] === undefined) {
            console.warn("Trigger not implemented", trigger.action);
        }
        else {
            triggers[trigger.action](state, trigger);
        }
    }
}
function interpretSecondLevelTrigger(state, trigger) {
    if (trigger.action !== undefined) {
        if (triggers[trigger.action] === undefined) {
            console.warn("Trigger not implemented", trigger.action);
        }
        else {
            triggers[trigger.action](state, trigger);
        }
    }
}
// Used in interpretCondition
const conditions = {
    hasTag: function (state, tag) {
        if (state.user.tags.includes(tag)) {
            console.log("has tag", tag);
            return true;
        }
        else {
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
    }
    else {
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
const onLeave = {
    startTimeLimit: function (state, trigger) {
        if (trigger.cancelOnLeave && state.user.timers[trigger.timerName]) {
            const timer = state.user.timers[trigger.timerName];
            window.clearTimeout(timer);
            //state.user.timers[trigger.timerName] = "cancelled";
            console.log("cancel timer:", trigger.timerName);
            delete state.user.timers[trigger.timerName];
        }
    },
    // required by TypeScript because of how ITrigger.action is defined
    playAudio: () => { },
    goToStation: () => { },
    cancelTimer: () => { },
};
//
export function interpretStation(state, station) {
    switch (station.type) {
        case "help":
            console.log("station  type help");
            break;
        case "station": {
            console.log("station type station");
            // Pick up the station the user just left, if any.
            const leavingStationId = state.user.stationsVisited[state.user.stationsVisited.length - 1];
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
            station.tags.forEach((tag) => {
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
//# sourceMappingURL=station.js.map