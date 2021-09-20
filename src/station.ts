// Interpret stations
import { AudioEngine } from "./audioEngine";
import { store, IState, Mutations } from "./store";
import { getParentUrl, getChildUrl, log } from "./utils";

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

export interface IEventStartTimeLimit {
  action: "startTimeLimit";
  timerName: string;
  cancelOnLeave: boolean;
  timeLimit: number;
  onTimeLimitEnd: ISecondLevelEvent;
}

export interface IEventGoToStation {
  action: "goToStation";
  toStation: StationID;
}

export interface IEventCancelTimer {
  action: "cancelTimer";
  timerName: string;
}

// export interface IEventCondition {
//   condition: "hasTag";
//   conditionArgs: string;
// }

export type IEventAction =
  | IEventPlayAudio
  | IEventPlayBackgroundAudio
  | IEventStartTimeLimit
  | IEventGoToStation
  | IEventCancelTimer;

// export type IEvent = IEventAction | IEventCondition;
export type IEvent = IEventAction;

export interface ISecondLevelEvent {
  action: "playAudio" | "startTimeLimit" | "goToStation" | "cancelTimer";
  audioFilename?: string;
  timerName?: string;
  cancelOnLeave?: boolean;
  timeLimit?: number;
  goToStation?: string;
  toStation?: string;
  condition?: "hasTag";
  conditionArgs?: string;
}

export interface IGameConfig {
  name: string;
  baseUrl: string;
  stationPaths: string[];
  stations: Record<StationID, Station>;
  choiceInfix: string;
  openStationsAtStart: StationID[];
  audioFileUrlBase: string;
  globalHelpAudio: {
    twoHelpLeftAudioFilename: string;
    oneHelpLeftAudioFilename: string;
    noHelpLeftAudioFilename: string;
    allHelpUsedAudioFilename: string;
    noHelpAtThisPointAudioFilename: string;
    globalHelpAudioFilename: string;
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

// Events
// this object serves as lookup function for our
const eventHandlers = {
  playAudio: function (_: IState, event: IEvent) {
    const playAudioEvent = event as IEventPlayAudio;

    // TODO, figure out which audioFile to play
    // const audioFile = playAudioEvent.audioFilenames[0];
    // playAudioFile(audioFile, false);
    const audioEventHandler = AudioEngine.getInstance();
    audioEventHandler.handlePlayAudioEvent(playAudioEvent);
  },

  playBackgroundAudio: function (_: IState, event: IEvent) {
    const playBackgroundAudioEvent = event as IEventPlayBackgroundAudio;
    const audioEventHandler = AudioEngine.getInstance();
    audioEventHandler.handlePlayBackgroundAudioEvent(playBackgroundAudioEvent);
  },

  startTimeLimit: function (state: IState, event: IEvent) {
    const startTimeLimitEvent = event as IEventStartTimeLimit;
    const timer = window.setTimeout(function () {
      if (startTimeLimitEvent.timerName) {
        store.commit(Mutations.removeTimer, startTimeLimitEvent.timerName);
      }

      startTimeLimitEvent.onTimeLimitEnd &&
        interpretSecondLevelEvent(state, startTimeLimitEvent.onTimeLimitEnd);
    }, startTimeLimitEvent.timeLimit * 1000) as number;
    if (timer) {
      const timerName = startTimeLimitEvent.timerName;
      store.commit(Mutations.addTimer, { timerName, timer });
    }
  },

  goToStation: function (_: IState, event: IEvent) {
    const goToStationEvent = event as IEventGoToStation;
    runStation(goToStationEvent.toStation);
  },

  cancelTimer: function (state: IState, event: IEvent) {
    const cancelTimerEvent = event as IEventCancelTimer;
    if (cancelTimerEvent.timerName) {
      const timer = state.user.timers[cancelTimerEvent.timerName];
      if (timer !== undefined) {
        window.clearTimeout(timer);
        store.commit(Mutations.removeTimer, cancelTimerEvent.timerName);
      }
    }
  },
};

function interpretEvent(state: IState, inEvent: IEvent) {
  const event = inEvent as IEventAction;
  eventHandlers[event.action](state, event);
}

function interpretSecondLevelEvent(state: IState, event: ISecondLevelEvent) {
  if (event.action !== undefined) {
    eventHandlers[event.action](state, event as IEvent);
  }
}

// Used in interpretCondition
const conditions = {
  // hasTag: function (state: IState, tag: string) {
  //   return state.user.tags.includes(tag);
  // },
};

// Takes a state a and event.
// If event has no condition return true.
// If event has a condition, pick it up and evaluate it, return result.
// function interpretCondition(state: IState, event: IEvent): boolean {
//   const conditionEvent = event as IEventCondition;
//   if (conditionEvent.condition && conditionEvent.conditionArgs) {
//     return conditions[conditionEvent.condition](
//       state,
//       conditionEvent.conditionArgs
//     );
//   } else {
//     return true;
//   }
// }

function runEventOnLeave(state: IState, event: IEvent): void {
  const actionEvent = event as IEventAction;
  if (onLeave[actionEvent.action] !== undefined) {
    onLeave[actionEvent.action](state, actionEvent);
  }
}

const onLeave = {
  startTimeLimit: function (state: IState, event: IEvent): void {
    const startTimeLimitEvent = event as IEventStartTimeLimit;

    const timer = state.user.timers[startTimeLimitEvent.timerName];
    window.clearTimeout(timer);

    store.commit(Mutations.removeTimer, startTimeLimitEvent.timerName);
  },

  // required by TypeScript because of how IEvent.action is defined
  // eslint-disable-next-line
  playAudio: () => {},
  // eslint-disable-next-line
  goToStation: () => {},
  // eslint-disable-next-line
  cancelTimer: () => {},
};

export function runStation(stationId: StationID): void {
  log("engine", ` runStation: ${stationId}`);

  // set the currently executing station
  // store.commit(Mutations.setCurrentStation, stationId);

  // Figure out which stations are visited
  // const visitedStationIds = store.state.user.stationsVisited;

  // If we have already been here

  if (store?.state?.gameConfig) {
    const station = store.state.gameConfig.stations[stationId];

    // Will also play audio
    interpretStation(station);

    // Update open stations
  }

  // if (visitedStationIds.includes(stationId)) {
  //   // if (store.state.user.helpAvailable <= 0) {
  //   //   console.warn("User has no more available helptracks");
  //   // } else {
  //   //     "User already visited this story. Playing helpfile: ",
  //   //     store.state.user.helpAvailable
  //   //   );
  //   //   playAudio("help-" + store.state.user.helpAvailable + ".mp3");
  //   //   store.commit(Mutations.decreaseHelpAvailable);
  //   // }
  // } else {
  //   // If we have NOT already been here

  //   if (store?.state?.gameConfig) {
  //     const station = store.state.gameConfig.stations[stationId];

  //     // Will also play audio
  //     interpretStation(store.state, station);

  //     // Update open stations
  //   }
  // }
}

export function interpretStation(station: Station): void {
  // For any station, check if there is any background audio running that should be stopped
  const audioEngine = AudioEngine.getInstance();
  audioEngine.cancelDueBackgroundSounds();

  const stationIsOpen = store.state.user.openStations?.includes(station.id);
  console.log("openStations: ", store.state.user.openStations);
  store.commit(Mutations.pushStationIdToStationsVisited, station.id);
  const counts = store.state.user.stationVisitCounts[station.id];

  if (stationIsOpen) {
    //  We scanned an open station, so we set that station as our current station
    store.commit(Mutations.setCurrentStation, station.id);

    switch (station.type) {
      case "help":
        if (counts.open === 1 && station.startStationId && store) {
          // If this is the first scan it opens the game.
          // This is a special case. It doesn't provide help. It opens the game

          // Open up the start station
          store.commit(Mutations.updateOpenStations, [station.startStationId]);

          // And run the startstation
          const startStation =
            store.state.gameConfig?.stations[station.startStationId];
          if (startStation) {
            interpretStation(startStation);
          }
        }
        console.log("HELP OPEN");
        break;

      case "choice":
      case "story": {
        // Pick up the station the user just left, if any.
        if (store.state.user.lastStationVisitedId !== undefined) {
          const leavingStation =
            store.state.gameConfig?.stations[
              store.state.user.lastStationVisitedId
            ];
          if (leavingStation !== undefined) {
            log(
              "interpretStation",
              `leavingStationId: ${store.state.user.lastStationVisitedId}`
            );
            // Handle events for the station the user just left
            if (leavingStation !== undefined) {
              leavingStation.events.forEach((event) => {
                runEventOnLeave(store.state, event);
              });
            }
          }
        }

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

        // Add station.id to users set of visited stations
        if (!store.state.user.stationsVisited.includes(station.id)) {
          log("interpretStation", `push stationid: ${station.id}`);
          store.commit(Mutations.pushStationIdToStationsVisited, station.id);
        }

        // Set users last visited station
        store.state.user.lastStationVisitedId = station.id;

        // Add tags from this station to users set of visited tags
        // station.tags.forEach((tag: string) => {
        //   if (!store.state.user.tags.includes(tag)) {
        //     store.state.user.tags.push(tag);
        //   }
        // });

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
    console.log("YOU'VE SCANNED A CLOSED STATION");

    store.commit(Mutations.pushStationIdToStationsVisited, station.id);

    let currentStation = undefined;
    if (
      store.state.gameConfig?.stations !== undefined &&
      store.state.user.currentStation !== undefined
    ) {
      currentStation =
        store.state.gameConfig.stations[store.state.user.currentStation];
    }

    switch (station.type) {
      case "help":
        // This is not the first scan of the start station

        if (currentStation && currentStation.hasHelpTracks()) {
          // This  station defines help tracks

          if (store.state.user.helpAvailable > 0) {
            // User still has help left
            // Find unused helptracks
            const heardHelptracks =
              store.state.user.playedHelpTracks[currentStation.id];

            console.log("HHT: ", heardHelptracks);
            if (heardHelptracks && heardHelptracks.length !== 0) {
              console.log("HERE 1");
              const firstUnheardHelpTrack =
                currentStation.helpAudioFilenames?.filter(
                  (track) => !heardHelptracks.includes(track)
                )[0];

              if (firstUnheardHelpTrack) {
                console.log("HERE 2");
                // There is one or more unheard helptracks
                audioEngine.playForegroundAudio(firstUnheardHelpTrack);

                // Add it to list of played helptracks. TODO add a mutation for this
                store.state.user.playedHelpTracks[currentStation.id].push(
                  firstUnheardHelpTrack
                );
                store.commit(Mutations.decreaseHelpAvailable);
              } else {
                console.log("HERE 4");
                // There no  unheard help tracks for this station left
                // Play the last help track free of charge
                if (currentStation.helpAudioFilenames) {
                  console.log("HERE 5");
                  const audioFilename =
                    currentStation.helpAudioFilenames[
                      currentStation.helpAudioFilenames.length - 1
                    ];
                  console.log("HERE 6: ", audioFilename);
                  if (audioFilename) {
                    audioEngine.playForegroundAudio(audioFilename);
                  }
                }
              }
            } else {
              console.log("HERE 6");
              // There are no played help tracks. Grab the first on and play it.
              console.log("");

              if (currentStation && currentStation.helpAudioFilenames) {
                console.log("HERE 7");
                const firstUnheardHelpTrack =
                  currentStation.helpAudioFilenames[0];

                if (firstUnheardHelpTrack) {
                  console.log("HERE 8");
                  // There is one ore more unheard helptracks
                  audioEngine.playForegroundAudio(firstUnheardHelpTrack);

                  // Add it to list of played helptracks. TODO add a mutation for this
                  store.state.user.playedHelpTracks[currentStation.id] = [
                    firstUnheardHelpTrack,
                  ];

                  store.commit(Mutations.decreaseHelpAvailable);
                }
              }
            }
          } else {
            // User has no help left
            console.log("User has no help left");

            const audioFilename =
              store.state.gameConfig?.globalHelpAudio.allHelpUsedAudioFilename;
            if (audioFilename) {
              audioEngine.playForegroundAudio(audioFilename);
            }
          }
        } else {
          // This station defines no help tracks. Notify user of that.
          const audioFilename =
            store.state.gameConfig?.globalHelpAudio
              .noHelpAtThisPointAudioFilename;
          if (audioFilename) {
            audioEngine.playForegroundAudio(audioFilename);
          }
        }
        // Figure out if there is any help to provide at this point in the game

        // if (station.helpAudioFilenames) {
        // } else {
        // }
        // // Here we provide the user with actual help

        console.log("HELP STATION CLOSED");
        break;

      case "choice":
      case "story":
        // Figure out if there is a help track to play for this station

        if (
          station.helpAudioFilenames === undefined ||
          station.helpAudioFilenames.length === 0
        ) {
          // There are not station specific help files
          console.log("THERE ARE NO STATION  SPECIFIC HELP FILES");
          // store.state.gameConfig?.globalHelpAudio
        } else {
          // There is at least on1 station specific help file
          console.log("THERE IS AT LEAST ONE STATION SPECIFIC HELP FILE");
        }

        break;

      default:
        // TODO log to sentry
        break;
    }
  }
}
