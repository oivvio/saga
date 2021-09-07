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
    <RootComponent msg="Hello hello!" />
  </div>
</template>

<style lang="scss">
div.App {
  background-color: pink;
}
</style>
