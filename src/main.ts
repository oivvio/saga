import "./styles/style.scss";

import Alpine from "alpinejs";

import { Howl } from "howler";
import { interpretStation } from "./station";
import { initQR, scanQRCode } from "./qrscanner";
import { stations } from "./state";
import {
  initializeState,
  increaseDummyCounter,
  getState,
  decreaseHelpAvailable,
} from "./state";

const AUDIOFILEBASE = "data/audio/";

function fakeScan(audio_id: number) {
  let state = getState();

  state.user.timers.forEach((timer) => console.log("timer left: ", timer));
  tryStory(audio_id);
}

function showQRScanner() {
  let state = getState();
  // state.user.showQRScanner = true;
  state.user.QRScannerIsDisplayed = true;
  scanQRCode((stationId: number) => {
    tryStory(stationId);
  });
}

// OP Figure out what's going on here
export function tryStory(stationId) {
  // Get the current state
  let state = getState();

  // Figure out which stations are visited
  let visitedStationIds = state.user.stationsVisited.map(
    (station) => station.id
  );

  // If we have already been here
  if (visitedStationIds.includes(stationId)) {
    if (state.user.helpAvailable <= 0) {
      console.warn("User has no more available helptracks");
    } else {
      console.log(
        "User already visited this story. Playing helpfile: ",
        state.user.helpAvailable
      );

      var story = loadStory(stationId, (station) => {
        playAudio("help-" + state.user.helpAvailable + ".mp3", "help");

        decreaseHelpAvailable();
      });
    }
  } else {
    // If we have NOT already been here

    loadStory(stationId, (station) => {
      interpretStation(state, station);

      // if (station.level && station.level !== state.user.onLevel) {
      //   state.user.onLevel = station.level;
      //   this.loadBackground(station);
      // }
    });
  }
}

export function playAudio(filename, type) {
  let state = getState();

  // Some other audio is playing so we to nothing
  if (state.audio.story.isPlaying) {
    console.log("Audio is playing. Wait.");
  } else {
    // create a new audioElement
    let fullAudioPath = AUDIOFILEBASE + filename;
    state.audio.story.isPlaying = false;
    let audioElement = new Howl({
      src: [fullAudioPath],
      html: true, // Stream (i.e.) start playing before downloaded
      onplay: () => {
        console.log("playing: ", filename);
        state.audio.story.isPlaying = true;
      },
      onend: () => {
        state.audio.story.isPlaying = false;
        state.user.showQRScanner = false;
        state.user.QRScannerCanBeDisplayed = true;
      },
    });

    state.audio.data = fullAudioPath;
    state.audio.volume = audioElement.volume();
    // console.log("state.audio.volume: ", state.audio.volume);
    console.log("press play");
    audioElement.play();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  initQR();
  increaseDummyCounter(1);

  setInterval(() => {
    increaseDummyCounter(1);
  }, 1000 * 60 * 60);
});

function loadStory(stationId, callback) {
  let url = "data/stations/" + stationId + ".json";
  console.log("loading Story: ", url);
  // $.get("data/stations/" + stationId + ".json", callback);
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      stations[stationId] = data;
      callback(data);
    });
}

// Initialize state and put it in a Alpine store
initializeState();

// Put some functions in global scope so we can access them from our templates.
//
// TODO remove this bandaid
(window as any).fakeScan = fakeScan;
(window as any).showQRScanner = showQRScanner;

// Instructions from the alpine js docs for starting Alpine
// Except for the "as any" part that's added for the benefit of tsc
(window as any).Alpine = Alpine;
Alpine.start();
