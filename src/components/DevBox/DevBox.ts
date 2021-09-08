import { defineComponent } from "vue";

import { runStation } from "../../engine";
import { Mutations } from "../../store";

export default defineComponent({
  name: "DevBox",

  data() {
    return { message: "play-timer-1" };
  },

  setup(props) {
    // this not available yet
    console.log("props: ", props);
  },

  mounted() {
    console.log("state: ", this.$store.state.user);
  },

  methods: {
    onDecode(result: string) {
      console.log(result);

      // this.result = result;
    },

    onSubmit() {
      runStation(this.message);
    },
    wipeHistory() {
      this.$store.commit(Mutations.wipeHistory);
    },
  },
});
