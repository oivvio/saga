<template>
  <div class="Animation">
    <div
      id="paneA"
      class="pane"
      :class="{ moveLeft: isOpen, moveBack: !isOpen }"
    >
      <img src="img/biljett_left.jpg" alt="" />
    </div>

    <div
      id="paneB"
      class="pane"
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
    return {};
  },

  computed: {
    isOpen() {
      return !this.$store.state.user.stationIsExecuting;
    },
  },
});
</script>

<style scoped lang="scss">
$duration: 0.3s;
div.Animation {
  z-index: 10;
  position: fixed;
  top: -10vh;
  left: 0;
  width: 100vw;
  height: 110vh;

  .pane {
    position: absolute;
    width: 50vw;
    height: 110vh;
    top: 0;
    img {
      object-fit: cover;
      width: 100%;
      height: 100%;
    }
    transition: $duration ease-in-out;
  }

  #paneA {
    left: 0vw;
    img {
      object-position: right top;
    }
  }

  #paneB {
    right: 0vw;
    img {
      object-position: left top;
    }
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
