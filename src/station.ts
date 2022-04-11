// Interpret stations
import { AudioEngine } from "./audioEngine";
import { store, IState, Mutations } from "./store";
import { getParentUrl, getChildUrl, loggy } from "./utils";

import lodash from "lodash";
const { last } = lodash;
import { IEvent, IEventPlayAudio, eventHandlers } from "./event";

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
  tags: string[];
  events: IEvent[];
  helpCost: number;
  helpAudioFilenames?: string[];
  startStationId?: StationID; // only on "help" stations
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
    helpPreroll: string;
  };
}

export class Station implements IStation {
  id: StationID;
  type: "story" | "help" | "choice";
  description: string;
  opens: StationID[];
  events: IEvent[];
  tags: string[];
  helpCost: number;
  helpAudioFilenames?: string[];
  startStationId?: StationID; // only on "help" stations
  //
  constructor(
    id: StationID,
    type: "story" | "help" | "choice",
    description: string,
    opens: StationID[],
    events: IEvent[],
    tags: string[],
    helpCost: number,
    helpAudioFilenames?: string[],

    startStationId?: StationID
  ) {
    this.id = id;
    this.type = type;
    this.description = description;
    this.opens = opens;
    this.events = events;
    this.tags = tags;
    this.helpCost = helpCost;
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
      obj.tags,
      obj.helpCost,
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

// load a game configuration from a given URL,
// mostly this will load a bunch of stations files
export async function loadGameConfigAndStations(
  configUrl: URL
): Promise<IGameConfig> {
  async function loadStationFromPath(
    baseUrl: URL,
    path: string
  ): Promise<Station | undefined> {
    const fullUrl = getChildUrl(baseUrl, path);
    return fetch(fullUrl.toString())
      .then(async (response) => {
        const obj = await response.json();
        return Station.initiateFromDTF(obj);
      })
      .catch((error) => {
        // TODO: Post to sentry
        console.log("loadError", fullUrl.toString(), error);
        return undefined;
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
        if (station) {
          gameConfig.stations[station.id] = station;
        }
      });

      return gameConfig;
    });
}

function interpretEvent(state: IState, inEvent: IEvent) {
  const event = inEvent as IEvent;
  eventHandlers[event.action](state, event);
}

// Used by runStation
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
  decreaseHelpAvailable: number;
  playHelp: boolean;
} {
  const result = {
    audioFilename: "",
    decreaseHelpAvailable: 0,
    playHelp: false,
  };

  // Sometimes we get here and hasHelpTracks does not exist,
  // Which the type checker should make impossible ...
  // So for now we wrap that call in a try catch
  let hasHelpTracks: boolean = false;
  try {
    hasHelpTracks = currentStation.hasHelpTracks();
  } catch (error) {
    console.log(error);
  }

  if (hasHelpTracks) {
    // This  station defines help tracks

    if (store.state.user.helpAvailable > 0 || store.state.debugInfiniteHelp) {
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
          result.decreaseHelpAvailable = currentStation.helpCost;
          result.playHelp = true;
        } else {
          // There no  unheard help tracks for this station left
          // Play the last help track free of charge

          if (currentStation.helpAudioFilenames) {
            const audioFilename = last(currentStation.helpAudioFilenames);

            if (audioFilename) {
              result.audioFilename = audioFilename;
              result.decreaseHelpAvailable = currentStation.helpCost;
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
            result.decreaseHelpAvailable = currentStation.helpCost;
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
        result.decreaseHelpAvailable = 0;
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
      result.decreaseHelpAvailable = 0;
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

    if (playInstructions.decreaseHelpAvailable !== 0) {
      store.commit(
        Mutations.decreaseHelpAvailable,
        playInstructions.decreaseHelpAvailable
      );
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

    if (store.state.debugInfiniteHelp) {
      helpLeftAudioFile =
        store.state.gameConfig?.globalAudioFilenames.twoHelpLeftAudioFilename;
    }

    if (helpLeftAudioFile) {
      if (playInstructions.audioFilename !== helpLeftAudioFile) {
        const audioFiles = [playInstructions.audioFilename, helpLeftAudioFile];

        // If this is not a free play we need to tell the player by prepending a global preroll
        if (playInstructions.decreaseHelpAvailable !== 0) {
          audioFiles.unshift(
            store.state.gameConfig?.globalAudioFilenames.helpPreroll as string
          );
        }

        // playInstructions.audioFilename,
        // helpLeftAudioFile,

        audioEngine.playMultipleForegroundAudio(audioFiles);
      } else {
        // There's an edge case where playInstructions.audioFilename === helpAudioFile
        // this makes sure we catch that and don't play the same file twice back to back.
        // A bit of a hack...
        audioEngine.playForegroundAudio(playInstructions.audioFilename, 0);
      }

      // Add track to list of played help tracks for the current station
      store.commit(Mutations.pushPlayedHelpTrack, {
        audioFilename: playInstructions.audioFilename,
        currentStation: currentStation,
      });
    }
  }
}

export function runStationById(stationId: StationID): void {
  if (store?.state?.gameConfig) {
    const station = store.state.gameConfig.stations[stationId];
    if (station) {
      runStation(station);
    }
  }
}

export function runStation(station: Station): void {
  // For any station, check if there is any background audio running that should be stopped
  const audioEngine = AudioEngine.getInstance();

  const stationIsOpen = store.state.user.openStations?.includes(station.id);

  // Add station.id to users set of visited stations, regardless of what happens later
  store.commit(Mutations.pushStationIdToStationsVisited, station.id);
  const counts = store.state.user.stationVisitCounts[station.id];

  // Add tags to users visited tags, regardless of what happens later
  if (station.tags) {
    store.commit(Mutations.pushTags, station.tags);
  }

  if (stationIsOpen) {
    // We scanned an open station. Which means we "move" the user to a new station
    // If we are currently at a station we should stick that id in our "lastStationVisited"
    if (store.state.user.currentStation) {
      store.commit(
        Mutations.setLastStationVisitedId,
        store.state.user.currentStation
      );
    }
    //  And then we update the current station
    store.commit(Mutations.setCurrentStation, station.id);

    // Now that we are officially "at" the new station let's check to see if there are any old
    // backgrounds sounds to cancel
    audioEngine.cancelDueBackgroundSounds();

    // And we cancel ALL background sounds that are still waiting to start
    audioEngine.cancelAllBackgroundTimeouts();

    switch (station.type) {
      case "help":
        handleHelpOpen(station, counts);
        break;

      case "choice":
      case "story": {
        // Handle events for the users current station
        station.events.forEach((event) => {
          interpretEvent(store.state, event);
        });

        // Open next stations, close previous
        // ... but we just ran this stations events, which might have transported
        // the user to another station. If so we should not update open / closed
        // stations based this station

        // HACK But we can't run this in "slutstriden"

        // eslint-disable-next-line
        const weAreStillAtThisStation =
          station.id === store.state.user.currentStation;
        const weAreNotInSlutstriden = !station.id.startsWith("pick-");
        if (
          weAreStillAtThisStation &&
          station.opens !== undefined &&
          store.state.gameConfig &&
          weAreNotInSlutstriden
        ) {
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

    let logData = JSON.parse(JSON.stringify(store.state));
    logData.msg = "SCANNED_CLOSED_STATION";
    loggy(logData);
    const visitCounts = store.state.user.stationVisitCounts[station.id];

    const currentStationID = store.state.user.currentStation || "";

    // The station the user is currently at
    const currentStation = store.state.gameConfig?.stations[currentStationID];

    const userJustLeftScannedStation =
      store.state.user.lastStationVisitedId === station.id;

    const userScannedCurrentStation =
      store.state.user.currentStation === station.id;

    // Per default we will play the storyFallbackAudioFilename
    let audioFilename =
      store.state.gameConfig?.globalAudioFilenames.storyFallbackAudioFilename;

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
        // so we might want to play a B or C track
        // but only if we just left the scanned station

        // if (userJustLeftScannedStation || userScannedCurrentStation && visitCounts) {
        if (userJustLeftScannedStation || userScannedCurrentStation) {
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
            }
          }
        }

        if (audioFilename) {
          audioEngine.playForegroundAudio(audioFilename, 0);
        }
        console.log("PLAYING: ", audioFilename);

        break;

      default:
        // TODO log to sentry
        break;
    }
  }
}
