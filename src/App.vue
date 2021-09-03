<script lang="ts">
import HelloWorld from "./components/HelloWorld/HelloWorld.vue";
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",

  props: {
    msg: String,
  },
  components: {
    HelloWorld,
  },
});
</script>

<template>
  <div id="content">
    <HelloWorld msg="And a hearty hello to you too!" />
  </div>
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
