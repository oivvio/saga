// import { tryStory } from "../../main_old";
import { tryStory } from "../../engine";

import { defineComponent } from "vue";

export default defineComponent({
  name: "DevBox",

  data() {
    return { message: "play-timer-1" };
  },

  setup(props) {
    console.log("props: ", props);
  },

  methods: {
    onDecode(result: string) {
      console.log(result);
      // this.result = result;
    },

    onSubmit() {
      console.log(this.message);
      tryStory(this.message);
    },
  },
});
