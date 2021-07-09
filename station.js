// Interpret stations

// Trigger actions
let triggers = {
    "playAudio": function (state, trigger) {
        state.playAudio(trigger.audioFilename, trigger.audioType)
    },
    "startTimeLimit": function (state, trigger) {
        let timer = window.setTimeout(function () {
            interpretTrigger(state, trigger.timeLimitEnd);
        }, trigger.timeLimit * 1000);
        state.user.timers[trigger.timerName] = timer;
    },
    "goToStation": function (state, trigger) {
        state.tryStory(trigger.toStation);
    }
}

let onLeave = {
    "startTimeLimit": function (state, trigger) {
        if (trigger.cancelOnLeave && state.user.timers[trigger.timerName]) {
            let timer = state.user.timers[trigger.timerName];
            window.clearTimeout(timer);
            state.user.timers[trigger.timerName] = "cancelled";
        }
    }
}

function interpretTrigger(state, trigger) {
    if (trigger.action !== undefined) {
        if (triggers[trigger.action] === undefined) {
            console.warn("Trigger not implemented", trigger.action);
        }
        triggers[trigger.action](state, trigger);
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
    getTags(user) {

    },
    interpretStation(state, station) {
        let leavingStation = state.user.stationsVisited[state.user.stationsVisited.length - 1];
        if (leavingStation !== undefined) {
            leavingStation.triggers.forEach(trigger => {
                triggerOnLeave(state, trigger);
            });
        }

        station.triggers.forEach(trigger => {
            interpretTrigger(state, trigger);
        });

        station.tags.forEach(tag => {
            state.user.tags.push(tag)
        })
        
        state.user.stationsVisited.push(station);
    }
}

window.Station = stationLogic;
