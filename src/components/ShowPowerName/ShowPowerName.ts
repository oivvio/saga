import { defineComponent } from "vue";

import { store } from "../../store";

const emotionSlugToName: { [key: string]: string } = {
  ilska: "Arg",
  sorg: "Ledsen",
  lycka: "Lycklig",
  gladje: "Glad",
  vild: "Vild",
};

const natureSlugToName: { [key: string]: string } = {
  sno: "Snö",
  mane: "Måne",
  vind: "Vind",
  regn: "Regn",
  sol: "Sol",
};

export default defineComponent({
  name: "ShowPowerName",
  computed: {
    powerName(): string {
      const emotionPart =
        emotionSlugToName[store.state.user.adHocData["powerName"][0] as string];

      const naturePart =
        natureSlugToName[store.state.user.adHocData["powerName"][1] as string];

      return emotionPart + " " + naturePart;
    },

    powerNameImage(): string {
      return "img/powerNameBackgrounds/temporary.jpg";
    },
  },
});
