import { store, IState, Mutations } from "../store";
import { IEvent, IEventPowerNameChoice } from "../event";
import { AudioEngine } from "../audioEngine";
import { runStationById } from "../station";

export const _powerNameChoicePickUsersPowername = function (
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

          // And push the user to checkin-sanna-vasen
          //           powerNameChoiceEvent.onSuccessOpen[0]
          runStationById(powerNameChoiceEvent.onSuccessOpen[0]);
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
