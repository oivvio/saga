<template>
  <div class="Tutorial">
    <video
      id="videoTutorial"
      controls
      autoplay
      playsinline
      webkit-playsinline
      v-on:ended="onEnded"
    >
      <source src="/video/sprickan2.mp4" type="video/mp4" />
    </video>
    <button @click="completeTutorial" v-if="displayButton">
      Starta scanner
      <img src="/img/starta-scanner.svg" alt="" />
    </button>
  </div>
</template>

<script lang="ts"></script>

<script lang="ts">
import { defineComponent } from "vue";
import { Mutations, store } from "../../store";

import { AudioEngine } from "../../audioEngine";

import * as Sentry from "@sentry/browser";

export default defineComponent({
  name: "Tutorial",
  data() {
    return {
      displayButton: false,
    };
  },

  methods: {
    onEnded(event: Event) {
      // For now do nothing so that we can tie
      // store.commit(Mutations.completeTutorial);
      this.displayButton = true;
    },

    completeTutorial() {
      // Don't dim the screen. Ever.
      try {
        // This should be loaded from index.html script tag
        const noSleep = new (window as any).NoSleep();
        noSleep.enable();
      } catch (error) {
        console.log(error);
        Sentry.captureMessage("Unable to enter noSleep");
      }

      // Remove the video element, since it's will sometimes continue playing on the "next" screen if we don't
      const video: HTMLVideoElement | null = document.getElementById(
        "videoTutorial"
      ) as HTMLVideoElement;
      if (video !== null) {
        video.remove();
      }

      // Play a little audio since our audio engine sometimes has problems playing the first file.
      const audioEngine = AudioEngine.getInstance();
      audioEngine.playSilenceToAppeaseiOS();

      setTimeout(() => {
        // Wait with this just a tad so that the silence has finished playing, and the first pause event has fired
        // before we say that we are done with the tutorial.
        // Because the "show unpause functionality" relies on this
        store.commit(Mutations.completeTutorial);
      }, 1000);

      // request fullscreen. Will not work in iOS
      try {
        document.documentElement.requestFullscreen();
      } catch (error) {
        console.log("This browser does not support fullscreen.");
      }
    },
  },
});
</script>

<style scoped lang="scss">
div.Tutorial {
  width: 100vw;
  height: 100vh;
  background-color: black;

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
    background-color: black;
    color: white;

    width: 80vw;
    position: relative;

    left: 10vw;
    top: 70vh;
    height: 3rem;
    border: none;
    font-size: 1.2rem;
    position: relative;
    img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
  }
}
</style>
