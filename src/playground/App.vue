<script lang="ts">
import { defineComponent } from "vue";
import { AudioEngine } from "../audioEngine.ts";

export default defineComponent({
  name: "App",

  created() {
    const audioEngine = new AudioEngine();
    console.log("IN HERE!", audioEngine);
  },
  props: {
    msg: String,
  },
});
</script>

<template>
  <div id="content" class="App">
    <h1>HERE WE GO!</h1>
  </div>
</template>

<style lang="scss">
body {
  margin: 0px;
  font-family: sans-serif;
  font-size: 20px;
  margin: 2rem;
}
div.App {
  width: 100vw;
  height: 50vh;
}
</style>
