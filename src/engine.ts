import { Howl } from "howler";
import { interpretStation } from "./station";
import { Mutations, store } from "./store";

const AUDIOFILEBASE = "data/audio/";

export function runStation(stationId: string): void {
  console.log(`in tryStory: ${stationId}`);
  // Get the current state
  //   const state = getState();

  // Figure out which stations are visited
  const visitedStationIds = store.state.user.stationsVisited;

  // If we have already been here

  console.log(visitedStationIds);

  if (visitedStationIds.includes(stationId)) {
    if (store.state.user.helpAvailable <= 0) {
      console.warn("User has no more available helptracks");
    } else {
      console.log(
        "User already visited this story. Playing helpfile: ",
        store.state.user.helpAvailable
      );

      playAudio("help-" + store.state.user.helpAvailable + ".mp3");
      store.commit(Mutations.decreaseHelpAvailable);
    }
  } else {
    // If we have NOT already been here

    if (store?.state?.gameConfig) {
      const station = store.state.gameConfig.stations[stationId];
      interpretStation(store.state, station);
    } else {
      console.log("stations not loaded");
    }
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
        store.commit(Mutations.setAudioStoryIsPlaying, true);
      },
      onend: () => {
        store.commit(Mutations.setAudioStoryIsPlaying, false);
      },
    });

    store.state.audio.story.data = fullAudioPath;
    store.state.audio.volume = audioElement.volume();
    // console.log("store.state.audio.volume: ", store.state.audio.volume);
    console.log("press play");
    audioElement.play();
  }
}
