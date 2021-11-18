import { defineComponent } from "vue";

import { Mutations } from "../../store";
import { StationID, runStationById } from "../../station";
import QrcodeVue from "qrcode.vue";

export default defineComponent({
  name: "DevBox",

  data: function (): { stationIdsToDisplayQRcodeFor: StationID[] } {
    return { stationIdsToDisplayQRcodeFor: [] };
  },

  methods: {
    wipeHistory() {
      this.$store.commit(Mutations.wipeHistory);
    },
    runStationOnButtonPress(stationId: StationID, forceRun: boolean) {
      // If forceRun==true, open stationId and close all others before running.

      if (forceRun) {
        this.$store.commit(Mutations.updateOpenStations, [stationId]);

        // Wait for the commit to propagate before going forward.
        // A bit of a hack but admissable in the debug panel.
        setTimeout(function () {
          runStationById(stationId);
        }, 500);
      } else {
        runStationById(stationId);
      }
    },

    getFullUrl(stationId: StationID): string {
      const baseUrl = this.$store.state.gameConfig?.baseUrl;
      const choiceInfix = this.$store.state.gameConfig?.choiceInfix || "";

      const url = `${baseUrl}/${stationId}`;

      let result = url;

      if (stationId.indexOf(choiceInfix) !== -1) {
        const base = choiceInfix + stationId.split(choiceInfix)[1];
        result = `${baseUrl}/${base}`;
      }
      console.log(result);
      return result;
    },

    showQrCode(stationId: StationID) {
      if (this.stationIdsToDisplayQRcodeFor.includes(stationId)) {
        this.stationIdsToDisplayQRcodeFor = [];
      } else {
        this.stationIdsToDisplayQRcodeFor = [];
        this.stationIdsToDisplayQRcodeFor.push(stationId);
      }
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

    quickAudio: {
      get: function () {
        return this.$store.state.debugQuickAudio;
      },

      set: function (value: boolean) {
        this.$store.state.debugQuickAudio = value;
      },
    },
  },

  components: {
    QrcodeVue,
  },
});
