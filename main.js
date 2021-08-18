import { Howl, Howler } from "howler";
const audiofilepath = "data/audio/";

function state() {
  return {
    user: {
      showQRScanner: false,
      stationsVisited: [],
      tags: [],
      timers: [],
      onLevel: 0,
      helpAvailable: 3,
    },
    audio: {
      volume: 0,
      story: {
        isPlaying: false,
        data: {},
      },
      background: {
        isPlaying: false,
        data: {},
      },
    },
    fakeId: "play-timer-1",

    // OP Why is this part of state?
    fakeScan: function (audio_id) {
      console.log("fakeScan", audio_id);

      this.tryStory(audio_id);
    },

    // OP Why is this part of state?
    showQRScanner: function () {
      this.user.showQRScanner = true;
      scanQRCode((audio_id) => {
        console.log("realScan", audio_id);
        this.tryStory(audio_id);
      });
    },

    // OP Why is this part of state?
    tryStory: function (audio_id) {
      let user = this.user;
      let state = this;
      let visited = [];

      for (let i = 0; i < user.stationsVisited.length; i++) {
        visited.push(user.stationsVisited[i].id);
      }

      if (visited.includes(audio_id)) {
        let user = this.user;
        if (user.helpAvailable <= 0) {
          console.warn("User has no more available helptracks");
        } else {
          console.log(
            "User already visited this story. Playing helpfile: ",
            user.helpAvailable
          );

          var story = loadStory(audio_id, (storyData) => {
            this.playAudio("help-" + user.helpAvailable + ".mp3", "help");
            user.helpAvailable--;
          });
        }
      } else {
        var story = loadStory(audio_id, (storyData) => {
          storyData.tags.forEach((tag) => {
            user.tags.push(tag);
          });

          window.Station.interpretStation(state, storyData);

          if (storyData.level && storyData.level !== user.onLevel) {
            user.onLevel = storyData.level;
            this.loadBackground(storyData);
          }
        });
      }
    },

    // OP Why is this part of state?
    playAudio: function (filename, type) {
      let audio = this.audio;
      let user = this.user;
      let state = this;
      if (this.audio.story.isPlaying) {
        console.log("Audio is playing. Wait.");
      } else {
        let audioElement = new Howl({
          src: [audiofilepath + filename],
          html: true,
          onplay: () => {
            console.log("playing: ", filename);
            audio.story.isPlaying = true;
          },
          onend: () => {
            audio.story.isPlaying = false;

            try {
              audio.background.data.fade(0.0, audioElement.volume(), 500);
              audio.background.data.play();
              audio.background.isPlaying = true;
            } catch (err) {
              console.warn(
                "No background track is loaded. Station needs to be set with a level."
              );
            }

            user.showQRScanner = false;
          },
        });

        audio.story.data = audioElement;
        audio.volume = audioElement.volume();

        if (audio.background.isPlaying) {
          audio.background.data.fade(audio.background.data.volume(), 0.0, 500);
          window.setTimeout(() => {
            audio.background.data.pause();
          }, 0.5 * 1000);
        }

        audio.story.data.play();
      }
    },

    // OP Why is this part of state?
    loadBackground: function () {
      let audio = this.audio;
      let user = this.user;

      let backgroundElement = new Howl({
        src: [audiofilepath + "/background-" + user.onLevel + ".mp3"],
        volume: 0,
        html: true,
        loop: true,
        onload: function () {
          console.log("new background with level: ", user.onLevel);
        },
      });
      audio.background.data = backgroundElement;
    },
  };
}

document.addEventListener("DOMContentLoaded", function () {
  window.initQR();
});

function loadStory(audio_id, callback) {
  $.get("data/stations/" + audio_id + ".json", callback);
}

window.state = state;
