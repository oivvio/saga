import { sample } from "lodash";
import { AudioEngine } from "./audioEngine";
import { store, IState, Mutations } from "./store";
import { StationID, runStation } from "./station";

export interface IEventPickRandomSample {
  action: "pickRandomSample";
  population: [];
  key: string;
}

export interface IEventPlayAudio {
  action: "playAudio";
  audioFilenames: string[];
}

export interface IEventPlayBackgroundAudio {
  action: "playAudio";
  audioFilename: string;
  wait: number;
  cancelOnLeave: boolean;
  loop: boolean;
}

// export interface IEventStartTimeLimit {
//   action: "startTimeLimit";
//   timerName: string;
//   cancelOnLeave: boolean;
//   timeLimit: number;
//   onTimeLimitEnd: ISecondLevelEvent;
// }

export interface IEventGoToStation {
  action: "goToStation";
  toStation: StationID;
}

export interface IEventCancelTimer {
  action: "cancelTimer";
  timerName: string;
}

export interface IEventCancelTimer {
  action: "cancelTimer";
  timerName: string;
}

export interface IEventPushToAdHocArrayEvent {
  action: "pushToAdHocArray";
  key: string;
  // eslint-disable-next-line
  value: any;
}

export interface IEventSwitchGotoStation {
  action: "switchGotoStation";
  // key: string;
  // eslint-disable-next-line
  switch: {
    condition: "adHocKeysAreEqual" | "adHocKeysAreNotEqual";
    parameters: { firstKey: string; secondKey: string; toStation: StationID };
  }[];
}

// export interface IEventCondition {
//   condition: "hasTag";
//   conditionArgs: string;
// }

export type IEvent =
  | IEventPlayAudio
  | IEventPlayBackgroundAudio
  | IEventPickRandomSample
  | IEventGoToStation
  | IEventPushToAdHocArrayEvent
  | IEventSwitchGotoStation;

// | IEventStartTimeLimit
// | IEventCancelTimer

// export type IEvent = IEventAction | IEventCondition;
// export type IEvent = IEventAction;

// export interface ISecondLevelEvent {
//   action: "playAudio" | "startTimeLimit" | "goToStation" | "cancelTimer";
//   audioFilename?: string;
//   timerName?: string;
//   cancelOnLeave?: boolean;
//   timeLimit?: number;
//   goToStation?: string;
//   toStation?: string;
//   condition?: "hasTag";
//   conditionArgs?: string;
// }

// Events

export const eventHandlers = {
  playAudio: function (_: IState, event: IEvent): void {
    const playAudioEvent = event as IEventPlayAudio;

    // TODO, figure out which audioFile to play
    // Since this is only run for the audio events if we are scanning an open station
    // we know that we should play the first track in our audioFilenames array.
    // This is the A-track
    //

    const audioEventHandler = AudioEngine.getInstance();

    audioEventHandler.handlePlayAudioEvent(playAudioEvent);
  },

  playBackgroundAudio: function (_: IState, event: IEvent): void {
    const playBackgroundAudioEvent = event as IEventPlayBackgroundAudio;
    const audioEventHandler = AudioEngine.getInstance();
    audioEventHandler.handlePlayBackgroundAudioEvent(playBackgroundAudioEvent);
  },

  // startTimeLimit: function (state: IState, event: IEvent) {
  //   const startTimeLimitEvent = event as IEventStartTimeLimit;
  //   const timer = window.setTimeout(function () {
  //     if (startTimeLimitEvent.timerName) {
  //       store.commit(Mutations.removeTimer, startTimeLimitEvent.timerName);
  //     }

  //     startTimeLimitEvent.onTimeLimitEnd &&
  //       interpretSecondLevelEvent(state, startTimeLimitEvent.onTimeLimitEnd);
  //   }, startTimeLimitEvent.timeLimit * 1000) as number;
  //   if (timer) {
  //     const timerName = startTimeLimitEvent.timerName;
  //     store.commit(Mutations.addTimer, { timerName, timer });
  //   }
  // },

  goToStation: function (_: IState, event: IEvent): void {
    const goToStationEvent = event as IEventGoToStation;
    runStation(goToStationEvent.toStation);
  },

  // cancelTimer: function (state: IState, event: IEvent) {
  //   const cancelTimerEvent = event as IEventCancelTimer;
  //   if (cancelTimerEvent.timerName) {
  //     const timer = state.user.timers[cancelTimerEvent.timerName];
  //     if (timer !== undefined) {
  //       window.clearTimeout(timer);
  //       store.commit(Mutations.removeTimer, cancelTimerEvent.timerName);
  //     }
  //   }
  // },

  pickRandomSample: function (_: IState, event: IEvent): void {
    const pickRandomSampleEvent = event as IEventPickRandomSample;
    const value = sample(pickRandomSampleEvent.population);
    const key = pickRandomSampleEvent.key;
    store.commit(Mutations.setAdHocData, { key, value });
  },

  pushToAdHocArray: function (_: IState, event: IEvent): void {
    const pushToAdHocArrayEvent = event as IEventPushToAdHocArrayEvent;
    const key = pushToAdHocArrayEvent.key;
    const value = pushToAdHocArrayEvent.value;

    store.commit(Mutations.pushToAdHocArray, { key, value });
  },

  switchGotoStation: function (_: IState, event: IEvent): void {
    const switchGotoStationEvent = event as IEventSwitchGotoStation;

    // Find the first switch that evaluates to true
    const matches = switchGotoStationEvent.switch.filter((currentCase) => {
      const firstKey = currentCase.parameters.firstKey;
      const secondKey = currentCase.parameters.secondKey;

      // Get string representation of proxy so we can do proper comparisons
      const firstValue = store.state.user.adHocData[firstKey].toString();

      const secondValue = store.state.user.adHocData[secondKey].toString();
      console.log(firstValue, secondValue, firstValue === secondValue);
      switch (currentCase.condition) {
        case "adHocKeysAreEqual":
          if (firstValue === secondValue) {
            return true;
          }
          break;

        case "adHocKeysAreNotEqual":
          if (firstValue !== secondValue) {
            return true;
          }
          break;

        default:
          break;
      }
    });

    const firstMatch = matches[0];

    // extract the stationId and go there;
    if (firstMatch !== undefined) {
      const toStation = firstMatch.parameters.toStation;
      console.log("DID WE GET HERE: ", toStation);
      runStation(toStation);
    }

    debugger;
  },
};
