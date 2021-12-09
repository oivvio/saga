import { defineComponent } from "vue";

import { Mutations } from "../../store";

import SagaQrReader from "../SagaQrReader/SagaQrReader.vue";
import Animation from "../Animation/Animation.vue";
import DevBox from "../DevBox/DevBox.vue";
import ShowPowerName from "../ShowPowerName/ShowPowerName.vue";
import Tutorial from "../Tutorial/Tutorial.vue";

export default defineComponent({
  name: "RootComponent",
  props: {
    msg: String,
  },
  data: function () {
    return {
      count: 1,
    };
  },

  methods: {
    displayQRScanner() {
      this.$store.commit(Mutations.displayQRScanner);
    },
  },

  computed: {
    QRScannerCanBeDisplayed() {
      return this.$store.state.user.QRScannerCanBeDisplayed;
    },

    QRScannerIsDisplayed() {
      return this.$store.state.user.QRScannerIsDisplayed;
    },

    displayDevBox() {
      return this.$store.state.debugDisplayDevBox;
    },

    playerWon(): boolean {
      return (
        this.$store.state.user.adHocData["playerWon"] ||
        this.$store.state.user.tags.includes("playerWon")
      );
    },

    showPowerName(): boolean {
      return this.$store.state.user.adHocData["showPowerName"];
    },

    hasPlayedTutorial(): boolean {
      return this.$store.state.user.hasPlayedTutorial;
    },
  },

  components: { SagaQrReader, DevBox, ShowPowerName, Animation, Tutorial },
});
