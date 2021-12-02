<template>
  <div class="Tutorial">
    <video controls autoplay v-on:ended="onEnded">
      <source
        src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        type="video/mp4"
      />
    </video>

    <button @click="completeTutorial">Öppna scannern</button>
  </div>
</template>

<script lang="ts"></script>

<script lang="ts">
import { defineComponent } from "vue";
import { Mutations, store } from "../../store";
export default defineComponent({
  name: "Tutorial",
  data() {
    return {};
  },

  mounted() {
    console.log("hallå");
  },

  methods: {
    onEnded(event: Event) {
      // For now do nothing so that we can tie
      // store.commit(Mutations.completeTutorial);
    },

    completeTutorial() {
      const noSleep = new (window as any).NoSleep();
      noSleep.enable();
      store.commit(Mutations.completeTutorial);
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
