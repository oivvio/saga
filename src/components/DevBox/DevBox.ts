import { defineComponent } from "vue";
import { runStation } from "../../engine";
import { Mutations } from "../../store";
import { StationID } from "../../station";

export default defineComponent({
  name: "DevBox",

  data() {
    return { message: "start" };
  },

  // setup(props) {},
  // mounted() {},

  methods: {
    onSubmit() {
      runStation(this.message as StationID);
    },
    wipeHistory() {
      this.$store.commit(Mutations.wipeHistory);
    },
  },
});
