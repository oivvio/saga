import { Howl } from "howler";
import { store, Mutations } from "./store";
import { IStation, interpretStation } from "./station";

const AUDIOFILEBASE = "data/audio/";

export function tryStory(stationId: string): void {
  console.log(`in tryStory: ${stationId}`);
  // Get the current state
  //   const state = getState();

  // Figure out which stations are visited
  const visitedStationIds = store.state.user.stationsVisited;

  // If we have already been here
  if (visitedStationIds.includes(stationId)) {
    if (store.state.user.helpAvailable <= 0) {
      console.warn("User has no more available helptracks");
    } else {
      console.log(
        "User already visited this story. Playing helpfile: ",
        store.state.user.helpAvailable
      );

      loadStory(stationId, () => {
        playAudio("help-" + store.state.user.helpAvailable + ".mp3");
        store.commit(Mutations.decreaseHelpAvailable);
      });
    }
  } else {
    // If we have NOT already been here

    loadStory(stationId, (station: IStation) => {
      interpretStation(store.state, station);

      // if (station.level && station.level !== store.state.user.onLevel) {
      //   store.state.user.onLevel = station.level;
      //   this.loadBackground(station);
      // }
    });
  }
}

export function playAudio(filename: string): void {
  // Some other audio is playing so we to nothing
  if (store.state.audio.story.isPlaying) {
    console.log("Audio is playing. Wait.");
  } else {
    // create a new audioElement
    const fullAudioPath = AUDIOFILEBASE + filename;
    store.state.audio.story.isPlaying = false;
    const audioElement = new Howl({
      src: [fullAudioPath],
      //html: true, // Stream (i.e.) start playing before downloaded
      html5: true, // Stream (i.e.) start playing before downloaded
      onplay: () => {
        console.log("playing: ", filename);
        store.state.audio.story.isPlaying = true;
      },
      onend: () => {
        store.state.audio.story.isPlaying = false;
        store.state.user.showQRScanner = false;
        store.state.user.QRScannerCanBeDisplayed = true;
      },
    });

    store.state.audio.story.data = fullAudioPath;
    store.state.audio.volume = audioElement.volume();
    // console.log("store.state.audio.volume: ", store.state.audio.volume);
    console.log("press play");
    audioElement.play();
  }
}

function loadStory(stationId: string, callback: (data: any) => void) {
  const url = "data/stations/" + stationId + ".json";
  console.log("loading Story: ", url);
  // $.get("data/stations/" + stationId + ".json", callback);
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      // stations[stationId] = data;
      callback(data);
    });
}
