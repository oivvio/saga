import { defineComponent } from "vue";
import { runStation } from "../../engine";
import { Mutations } from "../../store";
import { StationID } from "../../station";

export default defineComponent({
  name: "DevBox",

  // data() {
  //   return { message: "start" };
  // },

  // setup(props) {
  //   console.log("props");
  // },

  methods: {
    wipeHistory() {
      this.$store.commit(Mutations.wipeHistory);
    },
    runStationOnButtonPress(stationId: StationID) {
      runStation(stationId);
    },
  },

  computed: {
    gameConfigLoaded() {
      return this.$store.state.gameConfigLoaded;
    },

    nStations() {
      const stations = this.$store.state.gameConfig?.stations;
      if (stations) {
        return Object.keys(stations).length;
      }
      return "-";
    },

    theSame() {
      return "Hello";
    },
  },
});
