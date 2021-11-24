import { store, IState, Mutations } from "../store";
import { IEvent, IEventPowerNameChoice } from "../event";
import { AudioEngine } from "../audioEngine";

import { runStationById } from "../station";

export const _powerNameChoicePickGhostsPowername = function (
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
    console.log(
      "RADAC USER PICKED CORRECT NAME: ",
      partOfPowerNamePickedByUser
    );
    // play success sound
    audioEventHandler
      .playForegroundAudio(powerNameChoiceEvent.onSuccessPlay, 0)
      .then(() => {
        // reset try count
        state.user.adHocData[adHocKey] = 0;
        // open the next stations.
        //

        store.commit(
          Mutations.updateOpenStations,
          powerNameChoiceEvent.ghostOnSuccessOpen
        );

        if (powerNameChoiceEvent.part == 1) {
          // If we picked the second part of the ghosts powername we are done
          // Push the player to the successStation
          runStationById(powerNameChoiceEvent.ghostOnSuccessOpen[0]);
        }
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
