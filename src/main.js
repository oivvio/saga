import "./styles/style.scss";

import Alpine from "alpinejs";

import { Howl } from "howler";
import { interpretStation } from "./station";
import { initQR } from "./qrscanner";
import {
  initializeState,
  increaseDummyCounter,
  getState,
  decreaseHelpAvailable,
} from "./state";

const audiofilepath = "data/audio/";

function fakeScan(audio_id) {
  console.log("fakeScan: ", audio_id);
  let state = getState();

  state.user.timers.forEach((timer) => console.log("timer left: ", timer));
  tryStory(audio_id);
}

function showQRScanner(state) {
  state.user.showQRScanner = true;
  scanQRCode((audio_id) => {
    console.log("realScan", audio_id);
    tryStory(audio_id);
  });
}

function tryStory(audio_id) {
  let state = getState();

  let visitedStationIds = state.user.stationsVisited.map(
    (station) => station.id
  );
  console.log("visited: ", visitedStationIds);
  // for (let i = 0; i < state.user.stationsVisited.length; i++) {
  //   visitedStationIds.push(state.user.stationsVisited[i].id);
  // }

  // If we have already been here
  if (visitedStationIds.includes(audio_id)) {
    if (state.user.helpAvailable <= 0) {
      console.warn("User has no more available helptracks");
    } else {
      console.log(
        "User already visited this story. Playing helpfile: ",
        state.user.helpAvailable
      );

      var story = loadStory(audio_id, (station) => {
        playAudio("help-" + state.user.helpAvailable + ".mp3", "help");

        decreasHelpAvailable();
      });
    }
  } else {
    // If we have NOT already been here

    var story = loadStory(audio_id, (station) => {
      console.log("load Story callback");
      console.log(station);
      interpretStation(state, station);

      // if (station.level && station.level !== state.user.onLevel) {
      //   state.user.onLevel = station.level;
      //   this.loadBackground(station);
      // }
    });
  }
}

function playAudio(filename, type) {
  let state = getState();

  if (state.audio.story.isPlaying) {
    console.log("Audio is playing. Wait.");
  } else {
    let audioElement = new Howl({
      src: [audiofilepath + filename],
      html: true,
      onplay: () => {
        console.log("playing: ", filename);
        state.audio.story.isPlaying = true;
      },
      onend: () => {
        state.audio.story.isPlaying = false;

        state.user.showQRScanner = false;
      },
    });

    state.audio.story.data = audioElement;
    state.audio.volume = audioElement.volume();

    state.audio.story.data.play();
  }
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("===============================");

  initQR();
  increaseDummyCounter(1);

  setInterval(() => {
    increaseDummyCounter(1);
  }, 5000);
});

function loadStory(audio_id, callback) {
  let url = "data/stations/" + audio_id + ".json";
  console.log("loading Story: ", url);
  // $.get("data/stations/" + audio_id + ".json", callback);
  fetch(url)
    .then((response) => response.json())
    .then((data) => callback(data));
}

// Initialize state and put it in a Alpine store
initializeState();

// Put some functions in global scope so we can access them from our templates.
window.fakeScan = fakeScan;

// Instructions from the alpine js docs for starting Alpine
window.Alpine = Alpine;
Alpine.start();
console.log("alpine started");
