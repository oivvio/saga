<template>
  <div class="Animation">
    <div
      id="paneA"
      class="pane"
      @click.stop="open"
      :class="{ moveLeft: isOpen, moveBack: !isOpen }"
    >
      <img src="img/biljett_left.jpg" alt="" />
    </div>

    <div
      id="paneB"
      class="pane"
      @click.stop="open"
      :class="{ moveRight: isOpen, moveBack: !isOpen }"
    >
      <img src="img/biljett_right.jpg" alt="" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Animation",
  data() {
    return { isOpen: true };
  },

  methods: {
    open() {
      this.isOpen = true;
      console.log("open");
    },

    close() {
      this.isOpen = false;
      console.log("close");
    },
  },
});
</script>

<style scoped lang="scss">
$duration: 0.3s;
div.Animation {
  z-index: 10;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;

  .pane {
    position: absolute;
    width: 50vw;
    height: 100vh;
    top: 0;
    img {
      width: 100%;
      height: 100%;
    }
    transition: $duration ease-in-out;
  }

  #paneA {
    left: 0vw;
    background-color: pink;
  }

  #paneB {
    right: 0vw;
    background-color: lightblue;
  }

  .moveLeft {
    transform: translateX(-40vw);
  }

  .moveRight {
    transform: translateX(40vw);
  }

  .moveBack {
    transform: translateX(0vw);
  }
}
</style>
