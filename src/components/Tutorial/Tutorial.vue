<template>
  <div class="Tutorial">
    <video id="videoTutorial"
      controls
      autoplay
      playsinline
      webkit-playsinline
      v-on:ended="onEnded"
    >
      <source
        src="/video/SprickanH264.mp4"
        type="video/mp4"
      />
    </video>
    <button @click="completeTutorial" v-if="displayButton">Öppna scannern</button>
  </div>
</template>

<script lang="ts"></script>

<script lang="ts">
import { defineComponent } from "vue";
import { Mutations, store } from "../../store";

import { AudioEngine } from "../../audioEngine";
export default defineComponent({
  name: "Tutorial",
  data() {
      return {
          displayButton: false,
      };
  },

    mounted() {
        const video: HTMLVideoElement|null = document.getElementById("videoTutorial") as HTMLVideoElement;
        if(video !== null) {
            console.log("Try to start video");
            video.play();
        }

        console.log("hallå");
  },

  methods: {
    onEnded(event: Event) {
      // For now do nothing so that we can tie
      // store.commit(Mutations.completeTutorial);
        this.displayButton = true;

    },

    completeTutorial() {
      const noSleep = new (window as any).NoSleep();
      noSleep.enable();
      store.commit(Mutations.completeTutorial);

      // Remove the video element, since it's will sometimes continue playing on the "next" screen if we don't
        const video: HTMLVideoElement|null = document.getElementById("videoTutorial") as HTMLVideoElement;
        if(video !== null) {
            video.remove();
        }

      // Play a little audio since our audio engine sometimes has problems playing the first file.
      const audioEngine = AudioEngine.getInstance();
      const audioFile = "./audio/silence.mp3";
      audioEngine.playForegroundAudio(audioFile, 0);
    },
  },
});
</script>

<style scoped lang="scss">
div.Tutorial {
  width: 100vw;
  height: 100vh;

  video {
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    width: 100%;
    height: 50%;
    object-fit: contain;
  }

  button {
    z-index: 2;
    background-color: white;
    color: black;
    width: 80vw;
    position: absolute;
    bottom: 5%;
    left: 10vw;
    height: 3rem;
    border-radius: 3rem;
    font-size: 1.2rem;
  }
}
</style>
