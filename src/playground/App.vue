<script setup lang="ts">
// import { defineComponent } from "vue";
import { AudioEngine } from "../audioEngine.ts";


const audioEngine = new AudioEngine();
const prefix = "/data/sprickan";

const audioFilename =      "/level-0-barngravarna/barngravarna-anglamakerskan-choice-square_bg.mp3";
const fullAudio = prefix + audioFilename;



function play() {
    console.log("PLAY: ", fullAudio);

    audioEngine.newPlayForegroundAudio(fullAudio, 0);
}

</script>

<template>
  <div id="content" class="App">
    <h1>HERE WE GO!</h1>
    <button @click="play">PLAY</button>
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
}
</style>
