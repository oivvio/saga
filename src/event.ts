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

export interface IEventNoop {
  action: "noop";
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

export interface IEventChoiceBasedOnAbsenceOfTags {
  action: "choiceBasedOnAbsenceOfTags";
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
  then?: IEvent;
}

export interface IEventPowerNameChoice {
  action: "powerNameChoice";
  part: number; // 0 or 1
  onSuccessOpen: StationID[];
  onSuccessPlay: string;
  onFirstFailurePlay: string;
  onSecondFailurePlay: string;
  onSecondFailureGoTo: StationID;
  value: string;

  ghostOnSuccessOpen: StationID[];
  ghostOnSuccessPlay: string;
  ghostOnFirstFailurePlay: string;
  ghostOnSecondFailurePlay: string;
  ghostOnSecondFailureGoTo: StationID;
}

export interface IEventGoToStation {
  action: "goToStation";
  toStation: StationID;
}

export interface IEventOpenStation {
  action: "openStation";
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
  | IEventOpenStation
  | IEventPushToAdHocArrayEvent
  | IEventChoiceBasedOnTags
  | IEventChoiceBasedOnAbsenceOfTags
  | IEventSetAdHocDataEvent
  | IEventStartTimer
  | IEventCancelTimer
  | IEventPowerNameChoice
  | IEventNoop
  | IEventSwitchGotoStation;

const _powerNameChoicePickUsersPowername = function (
  state: IState,
  event: IEvent
): void {
  // TODO: Check for precence of #tag that indicates if user has already
  // picked their own powerName. Based on this pick power name for user or pick powername for ghost.

  // This eventhandler handles the very game specific choice of "powerNames" in the game "Sprickan"
  const powerNameChoiceEvent = event as IEventPowerNameChoice;
  const tries = state.user.adHocData["attemptsAtPickingTheRightPowerName"] || 0;

  const partOfPowerNamePickBySystem: string =
    state.user.adHocData["powerName"][powerNameChoiceEvent.part];

  const partOfPowerNamePickedByUser = powerNameChoiceEvent.value;

  const userPickedCorrectName =
    partOfPowerNamePickBySystem == partOfPowerNamePickedByUser;

  const audioEventHandler = AudioEngine.getInstance();
  if (userPickedCorrectName) {
    // play success sound
    audioEventHandler
      .playForegroundAudio(powerNameChoiceEvent.onSuccessPlay, 0)
      .then(() => {
        // reset try count
        state.user.adHocData["attemptsAtPickingTheRightPowerName"] = 0;
        // open the next stations.
        store.commit(
          Mutations.updateOpenStations,
          powerNameChoiceEvent.onSuccessOpen
        );

        // If user has set both parts of powerName successfully set an adHocValue to that effect.
        if (powerNameChoiceEvent.part == 1) {
          // TODO: Unclean!
          state.user.adHocData["userHasSetPowerName"] = true;
        }
        // No more action needed. New stations are open.
      });
  } else {
    // user picked the wrong name

    if (tries === 0) {
      // this is our first go around so we get another shot
      state.user.adHocData["attemptsAtPickingTheRightPowerName"] = 1;

      // Tell user they get another shot
      audioEventHandler.playForegroundAudio(
        powerNameChoiceEvent.onFirstFailurePlay,
        0
      );

      // Do nothing more. Same stations are still open and available for scanning.
    } else {
      // We go to "you-loose"
      audioEventHandler
        .playForegroundAudio(powerNameChoiceEvent.onSecondFailurePlay, 0)
        .then(() => {
          // reset try count
          state.user.adHocData["attemptsAtPickingTheRightPowerName"] = 0;

          // Open the failure station
          store.commit(Mutations.updateOpenStations, [
            powerNameChoiceEvent.onSecondFailureGoTo,
          ]);
          // Go to the failure station
          runStationById(powerNameChoiceEvent.onSecondFailureGoTo);
        });
    }
  }
};

const _powerNameChoicePickGhostsPowername = function (
  state: IState,
  event: IEvent
): void {
  // TODO: Check for precence of #tag that indicates if user has already
  // picked their own powerName. Based on this pick power name for user or pick powername for girl.

  // This eventhandler handles the very game specific choice of "powerNames" in the game "Sprickan"
  const adHocKey = "attemptsAtPickingTheGhostsPowerName";
  const powerNameChoiceEvent = event as IEventPowerNameChoice;
  const tries = state.user.adHocData[adHocKey] || 0;

  const partOfPowerNamePickBySystem: string = ["sorg", "mane"][
    powerNameChoiceEvent.part
  ];

  const partOfPowerNamePickedByUser = powerNameChoiceEvent.value;

  const userPickedCorrectName =
    partOfPowerNamePickBySystem == partOfPowerNamePickedByUser;

  const audioEventHandler = AudioEngine.getInstance();
  if (userPickedCorrectName) {
    // play success sound
    audioEventHandler
      .playForegroundAudio(powerNameChoiceEvent.onSuccessPlay, 0)
      .then(() => {
        // reset try count
        state.user.adHocData[adHocKey] = 0;
        // open the next stations.
        store.commit(
          Mutations.updateOpenStations,
          powerNameChoiceEvent.ghostOnSuccessOpen
        );
        // No more action needed. New stations are open.
      });
  } else {
    // user picked the wrong name

    if (tries === 0) {
      // this is our first go around so we get another shot
      state.user.adHocData[adHocKey] = 1;

      // Tell user they get another shot
      audioEventHandler.playForegroundAudio(
        powerNameChoiceEvent.ghostOnFirstFailurePlay,
        0
      );

      // Do nothing more. Same stations are still open and available for scanning.
    } else {
      // We go to "you-loose"
      audioEventHandler
        .playForegroundAudio(powerNameChoiceEvent.ghostOnSecondFailurePlay, 0)
        .then(() => {
          // reset try count
          state.user.adHocData[adHocKey] = 0;

          // Open the failure station
          store.commit(Mutations.updateOpenStations, [
            powerNameChoiceEvent.ghostOnSecondFailureGoTo,
          ]);
          // Go to the failure station
          runStationById(powerNameChoiceEvent.ghostOnSecondFailureGoTo);
        });
    }
  }
};

// Events

export const eventHandlers = {
  noop: function (state: IState, event: IEvent): void {
    // this is the no op event
    console.log(state, event);
  },

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

  playBackgroundAudio: function (state: IState, event: IEvent): void {
    const playBackgroundAudioEvent = event as IEventPlayBackgroundAudio;
    const audioEventHandler = AudioEngine.getInstance();
    audioEventHandler.handlePlayBackgroundAudioEvent(playBackgroundAudioEvent);

    if (playBackgroundAudioEvent.then !== undefined) {
      const childEvent = playBackgroundAudioEvent.then;
      eventHandlers[childEvent.action](state, childEvent);
    }
  },

  goToStation: function (_: IState, event: IEvent): void {
    const goToStationEvent = event as IEventGoToStation;

    store.commit(Mutations.updateOpenStations, [goToStationEvent.toStation]);

    runStationById(goToStationEvent.toStation);
  },

  openStation: function (_: IState, event: IEvent): void {
    const openStationEvent = event as IEventOpenStation;

    store.commit(Mutations.updateOpenStations, [openStationEvent.toStation]);
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

  choiceBasedOnAbsenceOfTags: function (state: IState, event: IEvent): void {
    const choiceBasedOnAbsenceOfTagsEvent =
      event as IEventChoiceBasedOnAbsenceOfTags;
    const tagsUserHasSeen = store.state.user.tags;
    const tagsUserIsRequiredToNotHaveSeen =
      choiceBasedOnAbsenceOfTagsEvent.tags;

    const userHasSeenNoneOfTheTags = every(
      tagsUserIsRequiredToNotHaveSeen.map((tagToCheckFor) => {
        return !tagsUserHasSeen.includes(tagToCheckFor);
      })
    );

    // We default to the user have seen at least one of the offending tags
    let childEvent = choiceBasedOnAbsenceOfTagsEvent.eventIfPresent;

    // And are suprised if the user has
    if (userHasSeenNoneOfTheTags) {
      childEvent = choiceBasedOnAbsenceOfTagsEvent.eventIfNotPresent;
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

    state.user.timers[startTimerEvent.name] = timerId as unknown as number;
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

  powerNameChoice: function (state: IState, event: IEvent): void {
    // Figure out if we are picking the users powerName or the powerName of the girl
    // that is helping the player.

    // TODO: Unclean!

    const userHasNotPickedTheirOwnPowerName =
      store.state.user.adHocData["userHasSetPowerName"] !== true;

    console.log(
      "userHasNotPickedTheirOwnPowerName: ",
      userHasNotPickedTheirOwnPowerName
    );
    if (userHasNotPickedTheirOwnPowerName) {
      console.log("pickUsersPowerName");
      _powerNameChoicePickUsersPowername(state, event);
    } else {
      console.log("pickGhostsPowerName");
      _powerNameChoicePickGhostsPowername(state, event);
    }
  },

  switchGotoStation: function (_: IState, event: IEvent): void {
    const switchGotoStationEvent = event as IEventSwitchGotoStation;

    // Find the first switch that evaluates to true
    const matches = switchGotoStationEvent.switch.filter((currentCase) => {
      // Used to check for one parameter in adHocDat

      // Get string representation of proxy so we can do proper comparisons
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
