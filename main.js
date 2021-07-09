import {Howl, Howler } from 'howler';
const audiofilepath = 'data/audio/';

function state() {
    return {
        user: {
            showQRScanner: false,
            stationsVisited: [],
            tags: [],
            timers: [],
        },
        audio: {
            isPlaying: false,
            data: {}
        },
        background: {
            isPlaying: false,
            data: {}
        },
        fakeId: "play-audio-condition",
        fakeScan: function(audio_id) {
            console.log("fakeScan", audio_id);

            this.tryStory(audio_id);
            this.user.showQRScanner = false;
        },
        showQRScanner: function() {
            this.user.showQRScanner = true;
            scanQRCode(audio_id => {
                this.tryStory(audio_id);
            });
        },
        tryStory: function(audio_id) {
            let user = this.user;
            let state = this;
            let visited = [];

            for (let i = 0; i < user.stationsVisited.length; i++) {
                visited.push(user.stationsVisited[i].id)
            }

            if (visited.includes(audio_id)) {
                //TODO: push user to next track
                console.log("User already visited this story")
            } else {
                var story = loadStory(audio_id, storyData => {
                    storyData.tags.forEach(tag => {
                        user.tags.push(tag);                        
                    });
                    window.Station.interpretStation(state, storyData);
                });
            } 
        },
        playAudio: function(filename, type) {
            let audio = this.audio;
            let state = this;

            if (this.background.isPlaying) {

            }
            if (this.audio.isPlaying) {
                console.log("Audio is playing. Wait.");
            } else {
                let audioElement = new Howl({
                    src: [audiofilepath + filename], 
                    html: true,
                    onplay: function() { 
                        console.log("playing: ", filename);
                        audio.isPlaying = true;
                                        },
                    onend: function() { 
                        console.log ("audio ended");
                        audio.isPlaying = false;
                }
                });
                
                audio.data = audioElement;
                audioElement.play();
            }
        }
    }
};

document.addEventListener("DOMContentLoaded", function() {
    window.initQR();
});

function loadStory(audio_id, callback) {
    $.get("data/stations/" + audio_id + ".json", callback); 
};

window.state = state;