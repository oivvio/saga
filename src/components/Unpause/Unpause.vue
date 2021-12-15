<template>
  <div class="Unpause">
    <button @click="onclick">ÅTERUPPTA</button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { AudioEngine } from "@/audioEngine";
import { Mutations, store } from "@/store";

export default defineComponent({
  name: "Unpause",

  computed: {},

  methods: {
    onclick() {
      // Resume the main audio
      const audioEngine = AudioEngine.getInstance();

      if (store.state.audio.foreground.isPlaying) {
        console.log("Resuming audio");
        audioEngine.resume();
      } else {
        console.log("There is no audio to resume");
      }
    },
  },
});
</script>

<style scoped lang="scss">
div.Unpause {
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
