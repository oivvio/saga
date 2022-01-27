<script setup lang="ts">
import { AudioEngine } from "../audioEngine.ts";
import { store } from "../store";
const audioEngine = new AudioEngine();
const prefix = "/data/sprickan";

// const audioFilename ="/level-0-barngravarna/barngravarna-anglamakerskan-choice-square_bg.mp3";

// approx 1.5 secs
const audioFilename = "/level-0-start/gravkapellet-choice-circle_1.mp3";
const fullAudio = prefix + audioFilename;

function play() {
  console.log("PLAY: ", fullAudio);
  audioEngine.newPlayForegroundAudio(fullAudio, 0);
}
</script>

<template>
  <div id="content" class="App">
    <button @click="play">PLAY</button>

    <table id="miniDevBox">
      <tr>
        <td>stationIsExecuting</td>
        <td>{{ this.store.state.user.stationIsExecuting }}</td>
      </tr>
      <tr>
        <td>currentlyPlayingForegroundAudio:</td>
        <td>{{ this.store.state.audio.foreground.audioFilename }}</td>
      </tr>
    </table>
  </div>
</template>

<style lang="scss">
body {
  margin: 0px;
  font-family: sans-serif;
  font-size: 20px;
  margin: 2rem;
  background-color: lightpink;
}

div.App {
  width: 100vw;
  height: 50vh;

  button {
    padding: 1rem;
    margin-top: 1rem;
    font-size: 1.4rem;
  }
  table#miniDevBox {
    margin-top: 5rem;
    background-color: lightgreen;

    td {
      border: 1px solid black;
    }
  }
}
</style>
