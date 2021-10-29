<script lang="ts">
import RootComponent from "./components/RootComponent/RootComponent.vue";
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",

  props: {
    msg: String,
  },

  components: {
    RootComponent,
  },
});
</script>

<template>
  <div id="content" class="App">
    <RootComponent />
  </div>
</template>

<style lang="scss">
div.App {
  width: 100vw;
  height: 50vh;
}
</style>
