import { defineComponent } from "vue";
import SagaQrReader from "../SagaQrReader/SagaQrReader.vue";

import { Mutations } from "../../store";

import DevBox from "../DevBox/DevBox.vue";
// import { loadGameConfig } from "../../station";

// interface IData {}

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
      return this.$store.state.displayDevBox;
    },
  },

  components: { SagaQrReader, DevBox },

  created: function () {
    console.log("Created the RootComponent");
  },
});
