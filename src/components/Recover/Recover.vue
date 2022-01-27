<template>
  <div class="Recover">
    <button v-if="paused" @click="resume">ÅTERUPPTA</button>
    <button v-else @click="retryAudio">NÄTVERKSFEL - FÖRSÖK IGEN</button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { AudioEngine } from "@/audioEngine";
import { Mutations, store } from "@/store";

export default defineComponent({
  name: "Recover",

  computed: {
    paused(): boolean {
      return store.state.audioPausedByExternalForces;
    },

    audioTimeout(): boolean {
      return !!store.state.user.audioTimeout;
    },
  },

  methods: {
    resume() {
      // Resume the main audio
      const audioEngine = AudioEngine.getInstance();
      if (store.state.audio.foreground.isPlaying) {
        console.log("Resuming audio");
        audioEngine.resume();
      } else {
        store.commit(Mutations.setAudioPausedByExternalForces, false);
      }
    },

    retryStation() {
      // Network timed out try playing it again
      // const audioEngine = AudioEngine.getInstance();
    },

    retryAudio() {
      // Network timed out try playing it again
        //

        const audioEngine = AudioEngine.getInstance();

        // Dig out the audioFile to retry
        const audioFilename = store.state.user.audioTimeout.audioFilename;

        // Dig out the position and backtrack 5 seconds
        const position = Math.max(0, store.state.user.audioTimeout.position - 5);

        // Clear the timeout
        store.commit(Mutations.clearAudioTimeout);

        store.commit(Mutations. setForegroundAudioIsPlaying, false);

        // Give it another go
        console.log("Retrying audio: ", audioFilename, position);
        audioEngine.playForegroundAudio(audioFilename, position);
    },
  },
});
</script>

<style scoped lang="scss">
div.Recover {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: black;
  justify-content: center;
  align-items: center;

  button {
    background-color: white;
    color: black;
    font-size: 1.2rem;
    border-radius: 2rem;
    width: 50vw;
    height: 4rem;
  }
}
</style>
