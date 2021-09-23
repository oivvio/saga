// Interpret stations
import { AudioEngine } from "./audioEngine";
import { store, IState, Mutations } from "./store";
import { getParentUrl, getChildUrl, log } from "./utils";

import {
  IEvent,
  IEventPlayAudio,
  // IEventPlayBackgroundAudio,
  // IEventPickRandomSample,
  // IEventGoToStation,
  eventHandlers,
} from "./event";

// Keep these types in sync with our json schema
// We validate all our game definition json files so we can be fully confident that
// our data conforms to our types
//
// type StationID = string;

// https://basarat.gitbook.io/typescript/main-1/nominaltyping
export interface IStationID_ extends String {
  _stationIdBrand: string; // To prevent type errors
}

enum StationIDBrand {
  _ = "",
}
export type StationID = StationIDBrand & string;

export interface IStation {
  id: StationID;
  type: "story" | "help" | "choice";
  description: string;
  opens: StationID[];
  events: IEvent[];
  helpAudioFilenames?: string[];
  startStationId?: StationID; // only on "help" stations
}

export class Station implements IStation {
  id: StationID;
  type: "story" | "help" | "choice";
  description: string;
  opens: StationID[];
  events: IEvent[];
  helpAudioFilenames?: string[];
  startStationId?: StationID; // only on "help" stations
  //
  constructor(
    id: StationID,
    type: "story" | "help" | "choice",
    description: string,
    opens: StationID[],
    events: IEvent[],
    helpAudioFilenames?: string[],
    startStationId?: StationID
  ) {
    this.id = id;
    this.type = type;
    this.description = description;
    this.opens = opens;
    this.events = events;
    this.helpAudioFilenames = helpAudioFilenames;
    this.startStationId = startStationId;
  }

  public static initiateFromDTF(obj: IStation): Station {
    return new Station(
      obj.id,
      obj.type,
      obj.description,
      obj.opens,
      obj.events,
      obj.helpAudioFilenames,
      obj.startStationId
    );
  }

  hasHelpTracks(): boolean {
    return (
      this.helpAudioFilenames !== undefined &&
      this.helpAudioFilenames.length > 0
    );
  }
}

export interface IGameConfig {
  name: string;
  baseUrl: string;
  stationPaths: string[];
  stations: Record<StationID, Station>;
  choiceInfix: string;
  openStationsAtStart: StationID[];
  audioFileUrlBase: string;
  globalAudioFilenames: {
    allHelpLeftAudioFilename: string;
    twoHelpLeftAudioFilename: string;
    oneHelpLeftAudioFilename: string;
    noHelpLeftAudioFilename: string;
    noHelpAtThisPointAudioFilename: string;
    globalHelpAudioFilename: string;
    storyFallbackAudioFilename: string;
  };
}

// load a game configuration from a given URL,
// mostly this will load a bunch of stations files
export async function loadGameConfigAndStations(
  configUrl: URL
): Promise<IGameConfig> {
  log("station", `in loadGameConfigAndStations ${configUrl}`);
  //
  // (http://example.com/parent, "./child/station1.json") -> data
  async function loadStationFromPath(
    baseUrl: URL,
    path: string
  ): Promise<Station> {
    const fullUrl = getChildUrl(baseUrl, path);
    return fetch(fullUrl.toString()).then(async (response) => {
      const obj = await response.json();
      return Station.initiateFromDTF(obj);
    });
  }

  return fetch(configUrl.toString())
    .then((response) => response.json())
    .then(async (gameConfig: IGameConfig) => {
      // extract baseURL from our configUrl
      const baseUrl = getParentUrl(configUrl);
      // Make a set of promises for fetching all stations
      const stationPromises = gameConfig.stationPaths.map((path) => {
        return loadStationFromPath(baseUrl, path);
      });

      // fetch the stations
      const stations = await Promise.all(stationPromises);

      // Put them into the data structure
      stations.forEach((station) => {
        gameConfig.stations[station.id] = station;
      });

      return gameConfig;
    });
}

function interpretEvent(state: IState, inEvent: IEvent) {
  //const event = inEvent as IEventAction;
  const event = inEvent as IEvent;
  eventHandlers[event.action](state, event);
}

// function interpretSecondLevelEvent(state: IState, event: ISecondLevelEvent) {
//   if (event.action !== undefined) {
//     eventHandlers[event.action](state, event as IEvent);
//   }
// }

// function runEventOnLeave(state: IState, event: IEvent): void {
//   const actionEvent = event as IEventAction;
//   if (onLeave[actionEvent.action] !== undefined) {
//     onLeave[actionEvent.action](state, actionEvent);
//   }
// }

// const onLeave = {
//   startTimeLimit: function (state: IState, event: IEvent): void {
//     const startTimeLimitEvent = event as IEventStartTimeLimit;

//     const timer = state.user.timers[startTimeLimitEvent.timerName];
//     window.clearTimeout(timer);

//     store.commit(Mutations.removeTimer, startTimeLimitEvent.timerName);
//   },

//   // required by TypeScript because of how IEvent.action is defined
//   // eslint-disable-next-line
//   playAudio: () => {},
//   // eslint-disable-next-line
//   goToStation: () => {},
//   // eslint-disable-next-line
//   cancelTimer: () => {},
// };

export function runStationById(stationId: StationID): void {
  log("engine", ` runStation: ${stationId}`);

  // set the currently executing station
  // store.commit(Mutations.setCurrentStation, stationId);

  // Figure out which stations are visited
  // const visitedStationIds = store.state.user.stationsVisited;

  // If we have already been here

  if (store?.state?.gameConfig) {
    const station = store.state.gameConfig.stations[stationId];

    // Will also play audio
    runStation(station);

    // Update open stations
  }
}

// Used by interpretStation
// broken out for readability
function handleHelpOpen(
  station: Station,
  visitCounts: { open: number; closed: number }
): void {
  if (visitCounts.open === 1 && station.startStationId && store) {
    // If this is the first scan it opens the game.
    // This is a special case. It doesn't provide help. It opens the game

    // Open up the start station
    store.commit(Mutations.updateOpenStations, [station.startStationId]);

    // And run the startstation
    const startStation =
      store.state.gameConfig?.stations[station.startStationId];
    if (startStation) {
      runStation(startStation);
    }
  }
}

/** Figure out which help track to play, and if users available help should be decrease or not */
function pickHelpTrack(currentStation: Station): {
  audioFilename: string;
  decreaseHelpAvailable: boolean;
  playHelp: boolean;
} {
  const result = {
    audioFilename: "",
    decreaseHelpAvailable: false,
    playHelp: false,
  };

  if (currentStation.hasHelpTracks()) {
    // This  station defines help tracks

    if (store.state.user.helpAvailable > 0) {
      // User still has help left
      // Find unused helptracks
      const heardHelptracks =
        store.state.user.playedHelpTracks[currentStation.id];
      const heardHelptracksExist =
        heardHelptracks && heardHelptracks.length !== 0;

      if (heardHelptracksExist) {
        const firstUnheardHelpTrack = currentStation.helpAudioFilenames?.filter(
          (track) => !heardHelptracks.includes(track)
        )[0];

        if (firstUnheardHelpTrack) {
          // There is one or more unheard helptracks
          result.audioFilename = firstUnheardHelpTrack;
          result.decreaseHelpAvailable = true;
          result.playHelp = true;
        } else {
          // There no  unheard help tracks for this station left
          // Play the last help track free of charge

          if (currentStation.helpAudioFilenames) {
            const audioFilename =
              currentStation.helpAudioFilenames[
                currentStation.helpAudioFilenames.length - 1
              ];

            if (audioFilename) {
              result.audioFilename = audioFilename;
              result.decreaseHelpAvailable = false;
              result.playHelp = true;
            }
          }
        }
      } else {
        // There are no played help tracks. Grab the first on and play it.
        if (currentStation.helpAudioFilenames) {
          const firstUnheardHelpTrack = currentStation.helpAudioFilenames[0];

          if (firstUnheardHelpTrack) {
            // There is one ore more unheard helptracks
            result.audioFilename = firstUnheardHelpTrack;
            result.decreaseHelpAvailable = true;
            result.playHelp = true;
          }
        }
      }
    } else {
      // User has no help left
      const audioFilename =
        store.state.gameConfig?.globalAudioFilenames.noHelpLeftAudioFilename;
      if (audioFilename) {
        result.audioFilename = audioFilename;
        result.decreaseHelpAvailable = false;
        result.playHelp = true;
      }
    }
  } else {
    // This station defines no help tracks. Notify user of that.
    const audioFilename =
      store.state.gameConfig?.globalAudioFilenames
        .noHelpAtThisPointAudioFilename;
    if (audioFilename) {
      result.audioFilename = audioFilename;
      result.decreaseHelpAvailable = false;
      result.playHelp = true;
    }
  }
  return result;
}

/**
 *
 * @param currentStation
 *
 * Figure out which help file to play, play it, decrease help available,
 * inform user of how much help is available;
 */
function handleHelpClosed(currentStation: Station) {
  // This is not the first scan of the start station
  const playInstructions = pickHelpTrack(currentStation);

  if (playInstructions.playHelp) {
    const audioEngine = AudioEngine.getInstance();

    if (playInstructions.decreaseHelpAvailable) {
      store.commit(Mutations.decreaseHelpAvailable);
    }
    // Figure out how much help is left
    let helpLeftAudioFile =
      store.state.gameConfig?.globalAudioFilenames.allHelpLeftAudioFilename;

    switch (store.state.user.helpAvailable) {
      case 3:
        // helpLeftAudioFile = store.state.gameConfig?.globalAudioFilenames.
        break;
      case 2:
        helpLeftAudioFile =
          store.state.gameConfig?.globalAudioFilenames.twoHelpLeftAudioFilename;
        break;
      case 1:
        helpLeftAudioFile =
          store.state.gameConfig?.globalAudioFilenames.oneHelpLeftAudioFilename;
        break;

      case 0:
        helpLeftAudioFile =
          store.state.gameConfig?.globalAudioFilenames.noHelpLeftAudioFilename;
        // helpLeftAudioFile = undefined; // Because
        break;
      default:
        break;
    }

    if (helpLeftAudioFile) {
      if (playInstructions.audioFilename !== helpLeftAudioFile) {
        audioEngine.playMultipleForegroundAudio([
          playInstructions.audioFilename,
          helpLeftAudioFile,
        ]);
      } else {
        // There's an edge case where playInstructions.audioFilename === helpAudioFile
        // this makes sure we catch that and don't play the same file twice back to back.
        // A bit of a hack...
        audioEngine.playForegroundAudio(playInstructions.audioFilename);
      }

      // Add track to list of played help tracks for the current station
      store.commit(Mutations.pushPlayedHelpTrack, {
        audioFilename: playInstructions.audioFilename,
        currentStation: currentStation,
      });
    }
  }
}

export function runStation(station: Station): void {
  // For any station, check if there is any background audio running that should be stopped
  const audioEngine = AudioEngine.getInstance();
  audioEngine.cancelDueBackgroundSounds();

  const stationIsOpen = store.state.user.openStations?.includes(station.id);

  // Add station.id to users set of visited stations, regardless of what happens later
  store.commit(Mutations.pushStationIdToStationsVisited, station.id);
  const counts = store.state.user.stationVisitCounts[station.id];

  if (stationIsOpen) {
    //  We scanned an open station, so we set that station as our current station
    store.commit(Mutations.setCurrentStation, station.id);

    switch (station.type) {
      case "help":
        handleHelpOpen(station, counts);
        break;

      case "choice":
      case "story": {
        // Pick up the station the user just left, if any.
        // if (store.state.user.lastStationVisitedId !== undefined) {
        //   const leavingStation =
        //     store.state.gameConfig?.stations[
        //       store.state.user.lastStationVisitedId
        //     ];

        //   if (leavingStation !== undefined) {
        //     log(
        //       "interpretStation",
        //       `leavingStationId: ${store.state.user.lastStationVisitedId}`
        //     );
        //     // Handle events for the station the user just left
        //     if (leavingStation !== undefined) {
        //       leavingStation.events.forEach((event) => {
        //         runEventOnLeave(store.state, event);
        //       });
        //     }
        //   }
        // }

        // Handle events for the users current station
        station.events.forEach((event) => {
          log(
            "interpretStation",
            `handle events for users current station  ${event}`
          );
          // if (interpretCondition(store.state, event)) {
          interpretEvent(store.state, event);
          // }
        });

        log(
          "interpretStation",
          `post handle events ${store.state.user.stationsVisited}`
        );

        // Set users last visited station
        store.state.user.lastStationVisitedId = station.id;

        // Open next stations, close previous
        if (station.opens !== undefined && store.state.gameConfig) {
          log("station", `interpretStation ${station.opens}`);
          store.commit(Mutations.updateOpenStations, station.opens);
        }
        break;
      }

      default:
        // TODO log to sentry
        break;
    }
  } else {
    // User scanned a closed station
    const visitCounts = store.state.user.stationVisitCounts[station.id];

    const currentStation =
      store.state.gameConfig?.stations[store.state.user.currentStation || ""];

    switch (station.type) {
      case "help":
        // Help is run on the station the user is currently "at", not the help station itself.
        if (currentStation) {
          handleHelpClosed(currentStation);
        }

        break;

      case "choice":
      case "story":
        // We're working with a closed station here
        // so we figure out which B or C track to play.

        if (visitCounts) {
          let audioFilename = undefined;
          // Dig out the event
          const event = station.events.filter(
            (event) => event.action == "playAudio"
          )[0] as IEventPlayAudio;

          if (event) {
            if (event.audioFilenames.length > 1) {
              // There is more than an A track
              // Add 1 to skip the A-track
              let index = visitCounts.closed + 1;

              // But don't go pass the last audioFilename
              if (index > event.audioFilenames.length - 1) {
                index = event.audioFilenames.length - 1;
              }

              audioFilename = event.audioFilenames[index];
            } else {
              // There is NO more than an A track
              //
              // TODO IS THIS NEEDED?
              audioFilename =
                store.state.gameConfig?.globalAudioFilenames
                  .storyFallbackAudioFilename;
            }

            if (audioFilename) {
              audioEngine.playForegroundAudio(audioFilename);
            }
          }
        }
        break;

      default:
        // TODO log to sentry
        break;
    }
  }
}
