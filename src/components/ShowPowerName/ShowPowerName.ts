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

const powerNameToImage: { [key: string]: string } = {
  "gladje,sol": "img/slutdiplom/Gladje_Sol.png",
  "gladje,vind": "img/slutdiplom/Gladje_Vind.png",
  "gladje,sno": "img/slutdiplom/Gladje_Sno.png",
  "gladje,mane": "img/slutdiplom/Gladje_Mane.png",
  "gladje,regn": "img/slutdiplom/Gladje_Regn.png",
  "sorg,sol": "img/slutdiplom/Sorg_Sol.png",
  "sorg,vind": "img/slutdiplom/Sorg_Vind.png",
  "sorg,sno": "img/slutdiplom/Sorg_Sno.png",
  "sorg,regn": "img/slutdiplom/Sorg_Regn.png",
  "lycka,sol": "img/slutdiplom/Lycko_Sol.png",
  "lycka,vind": "img/slutdiplom/Lycko_Vind.png",
  "lycka,sno": "img/slutdiplom/Lycko_Sno.png",
  "lycka,mane": "img/slutdiplom/Lycko_Mane.png",
  "lycka,regn": "img/slutdiplom/Lycko_Regn.png",
  "ilska,sol": "img/slutdiplom/Ilsken_Sol.png",
  "ilska,vind": "img/slutdiplom/Ilsken_Vind.png",
  "ilska,sno": "img/slutdiplom/Ilsken_Sno.png",
  "ilska,mane": "img/slutdiplom/Ilsken_Mane.png",
  "ilska,regn": "img/slutdiplom/Ilsken_Regn.png",
  "vild,sol": "img/slutdiplom/Vild_Sol.png",
  "vild,vind": "img/slutdiplom/Vild_Vind.png",
  "vild,sno": "img/slutdiplom/Vild_Sno.png",
  "vild,mane": "img/slutdiplom/Vild_Mane.png",
  "vild,regn": "img/slutdiplom/Vild_Regn.png",
};

export default defineComponent({
  name: "ShowPowerName",

  data: function () {
    return {
      playerName: "",
      playerNameSet: false,
    };
  },
  computed: {
    powerName(): string {
      const emotionPart =
        emotionSlugToName[store.state.user.adHocData["powerName"][0] as string];

      const naturePart =
        natureSlugToName[store.state.user.adHocData["powerName"][1] as string];

      return emotionPart + " " + naturePart;
    },

    powerNameImage(): string {
      return powerNameToImage[store.state.user.adHocData["powerName"]];
    },
  },
});
