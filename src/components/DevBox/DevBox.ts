import { defineComponent } from "vue";

import { Mutations } from "../../store";
import { StationID, runStation } from "../../station";

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

    visitCount(stationId: StationID) {
      const store = this.$store;
      function helper(status: "open" | "closed"): number {
        const entry = store.state.user?.stationVisitCounts[stationId];
        if (entry) {
          const visits = entry[status] as number | undefined;
          return visits ? visits : 0;
        }
        return 0;
      }
      const openVisits = helper("open");
      const closedVisits = helper("closed");

      return ` visits:[${openVisits}/${closedVisits}]`;
    },

    openOrClosed(stationId: StationID) {
      return this.$store.state.user.openStations.includes(stationId)
        ? "open"
        : "closed";
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
  },
});
