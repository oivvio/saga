import { sample } from "lodash";
import { AudioEngine } from "./audioEngine";
import { store, IState, Mutations } from "./store";
import { StationID, runStationById } from "./station";

export interface IEventPickRandomSample {
  action: "pickRandomSample";
  population: [];
  key: string;
}

export interface IEventPlayAudio {
  action: "playAudio";
  wait: number;
  audioFilenames: string[];
  then?: IEvent;
}

export interface IEventPlayAudioBasedOnAdHocValue {
  action: "playAudio";
  key: string;
  audioFilenameMap: Record<string, string>;
}

export interface IEventPlayBackgroundAudio {
  action: "playAudio";
  audioFilename: string;
  wait: number;
  cancelOnLeave: boolean;
  loop: boolean;
}

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

interface ISwitchCompareTwoAdHocKeys {
  condition: "adHocKeysAreEqual" | "adHocKeysAreNotEqual";
  parameters: {
    firstKey: string;
    secondKey: string;
    toStation: StationID;
  };
}

interface ISwitchAdHocKeyEquals {
  condition: "adHocKeyEquals";

  parameters: {
    key: string;
    // eslint-disable-next-line
    value: any;
    toStation: StationID;
  };
}

type ISwitch = ISwitchAdHocKeyEquals | ISwitchCompareTwoAdHocKeys;
export interface IEventSwitchGotoStation {
  action: "switchGotoStation";
  switch: ISwitch[];
}

export type IEvent =
  | IEventPlayAudio
  | IEventPlayAudioBasedOnAdHocValue
  | IEventPlayBackgroundAudio
  | IEventPickRandomSample
  | IEventGoToStation
  | IEventPushToAdHocArrayEvent
  | IEventSwitchGotoStation;

// Events

export const eventHandlers = {
  playAudio: function (state: IState, event: IEvent): void {
    const playAudioEvent = event as IEventPlayAudio;
    const audioEventHandler = AudioEngine.getInstance();
    const audioPromise = audioEventHandler.handlePlayAudioEvent(playAudioEvent);

    // eslint-disable-next-line
    audioPromise.then((_) => {
      if (playAudioEvent.then !== undefined) {
        const childEvent = playAudioEvent.then;
        eventHandlers[childEvent.action](state, childEvent);
      }
    });
  },

  playAudioBasedOnAdHocValue: function (state: IState, event: IEvent): void {
    const playAudioEvent = event as IEventPlayAudioBasedOnAdHocValue;
    const audioEventHandler = AudioEngine.getInstance();

    const secondLevelKey = state.user.adHocData[playAudioEvent.key];

    console.log("SecondLevelKey: ", secondLevelKey);

    const audioFilename = playAudioEvent.audioFilenameMap[secondLevelKey];
    console.log("audioFilename: ", audioFilename);
    if (audioFilename) {
      audioEventHandler.playForegroundAudio(audioFilename, 0);
    }

    // const audioPromise = audioEventHandler.handlePlayAudioEvent(playAudioEvent);

    // eslint-disable-next-line
    // audioPromise.then((_) => {
    //   if (playAudioEvent.then !== undefined) {
    //     const childEvent = playAudioEvent.then;
    //     eventHandlers[childEvent.action](state, childEvent);
    //   }
    // });
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
    runStationById(goToStationEvent.toStation);
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
      // Used to check for one parameter in adHocData

      // Get string representation of proxy so we can do proper comparisons
      //

      let result = false;
      switch (currentCase.condition) {
        case "adHocKeysAreNotEqual":
        case "adHocKeysAreEqual":
          // eslint-disable-next-line
          const cc1 = currentCase as ISwitchCompareTwoAdHocKeys;
          // eslint-disable-next-line
          const firstKey = cc1.parameters.firstKey;
          // eslint-disable-next-line
          const secondKey = cc1.parameters.secondKey;
          // eslint-disable-next-line
          const firstValue = store.state.user.adHocData[firstKey]?.toString();
          // eslint-disable-next-line
          const secondValue = store.state.user.adHocData[secondKey]?.toString();

          if (
            cc1.condition === "adHocKeysAreEqual" &&
            firstValue === secondValue
          ) {
            result = true;
          }

          if (
            cc1.condition === "adHocKeysAreNotEqual" &&
            firstValue !== secondValue
          ) {
            result = true;
          }

          break;

        case "adHocKeyEquals":
          // eslint-disable-next-line
          const cc2 = currentCase as ISwitchAdHocKeyEquals;
          result =
            store.state.user.adHocData[cc2.parameters.key] ==
            cc2.parameters.key;
          break;

        default:
          break;
      }
      return result;
    });

    const firstMatch = matches[0];

    // extract the stationId and go there;
    if (firstMatch !== undefined) {
      const toStation = firstMatch.parameters.toStation;

      // Open up the destination
      store.commit(Mutations.updateOpenStations, [toStation]);

      // And go to that station
      runStationById(toStation);
    }
  },
};
