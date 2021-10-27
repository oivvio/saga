import { sample, every } from "lodash";
import { AudioEngine } from "./audioEngine";
import { store, IState, Mutations } from "./store";
import { StationID, runStationById } from "./station";

export interface IEventPickRandomSample {
  action: "pickRandomSample";
  // eslint-disable-next-line
  population: any[];
  key: string;
}

export interface IEventPlayAudio {
  action: "playAudio";
  wait: number;
  audioFilenames: string[];
  then?: IEvent;
}

export interface IEventStartTimer {
  action: "startTimer";
  name: string;
  time: number;
  then: IEvent;
}

export interface IEventCancelTimer {
  action: "cancelTimer";
  name: string;
}

export interface IEventPlayAudioBasedOnAdHocValue {
  action: "playAudioBasedOnAdHocValue";
  key: string;
  audioFilenameMap: Record<string, string>;
  then?: IEvent;
}

export interface IEventChoiceBasedOnTags {
  action: "choiceBasedOnTags";
  tags: string[];
  eventIfPresent: IEvent;
  eventIfNotPresent: IEvent;
}

export interface IEventPlayBackgroundAudio {
  action: "playBackgroundAudio";
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

export interface IEventPushToAdHocArrayEvent {
  action: "pushToAdHocArray";
  key: string;
  // eslint-disable-next-line
  value: any;
}

export interface IEventSetAdHocDataEvent {
  action: "setAdHocData";
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
  | IEventChoiceBasedOnTags
  | IEventSetAdHocDataEvent
  | IEventStartTimer
  | IEventCancelTimer
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
    const audioFilename = playAudioEvent.audioFilenameMap[secondLevelKey];

    if (audioFilename) {
      const audioPromise = audioEventHandler.playForegroundAudio(
        audioFilename,
        0
      );

      audioPromise.then(() => {
        if (playAudioEvent.then !== undefined) {
          const childEvent = playAudioEvent.then;
          eventHandlers[childEvent.action](state, childEvent);
        }
      });
    }
  },

  playBackgroundAudio: function (_: IState, event: IEvent): void {
    const playBackgroundAudioEvent = event as IEventPlayBackgroundAudio;
    const audioEventHandler = AudioEngine.getInstance();
    audioEventHandler.handlePlayBackgroundAudioEvent(playBackgroundAudioEvent);
  },

  goToStation: function (_: IState, event: IEvent): void {
    const goToStationEvent = event as IEventGoToStation;

    store.commit(Mutations.updateOpenStations, [goToStationEvent.toStation]);

    runStationById(goToStationEvent.toStation);
  },

  choiceBasedOnTags: function (state: IState, event: IEvent): void {
    const choiceBasedOnTagsEvent = event as IEventChoiceBasedOnTags;
    const tagsUserHasSeen = store.state.user.tags;
    const tagsUserIsRequiredToHaveSeen = choiceBasedOnTagsEvent.tags;

    const userHasSeenAllRequiredTags = every(
      tagsUserIsRequiredToHaveSeen.map((tagToCheckFor) => {
        return tagsUserHasSeen.includes(tagToCheckFor);
      })
    );

    // We default to the user not having seen all required tags.
    let childEvent = choiceBasedOnTagsEvent.eventIfNotPresent;

    // And are suprised if the user has
    if (userHasSeenAllRequiredTags) {
      childEvent = choiceBasedOnTagsEvent.eventIfPresent;
    }

    // Run the choice event
    eventHandlers[childEvent.action](state, childEvent);
  },

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

  setAdHocData: function (_: IState, event: IEvent): void {
    const setAdHocDataEvent = event as IEventSetAdHocDataEvent;
    const key = setAdHocDataEvent.key;
    const value = setAdHocDataEvent.value;
    store.commit(Mutations.setAdHocData, { key, value });
  },

  startTimer: function (state: IState, event: IEvent): void {
    const startTimerEvent = event as IEventStartTimer;

    console.log("staring timer: ", startTimerEvent.name);

    const timerId = setTimeout(() => {
      console.log("staring  reached 0: ", startTimerEvent.name);
      const childEvent = startTimerEvent.then;

      eventHandlers[childEvent.action](state, childEvent);
    }, startTimerEvent.time * 1000);

    state.user.timers[startTimerEvent.name] = timerId as number;
  },

  cancelTimer: function (state: IState, event: IEvent): void {
    const cancelTimerEvent = event as IEventCancelTimer;

    // pick out the timer to cancel
    const timerId = state.user.timers[cancelTimerEvent.name];
    if (timerId) {
      // cancel it
      console.log("stopping timer: ", cancelTimerEvent.name);
      clearTimeout(timerId);
      delete state.user.timers[cancelTimerEvent.name];
    }
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
  // End of switchGotoStation
};
