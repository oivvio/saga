import { defineComponent } from "vue";

// rxjs docs says that this is the way but it does not work.
// So we pinned rxjs to an older version (6.6.7) to get it to work
import { Subject } from "rxjs";
import { distinctUntilKeyChanged, filter, tap } from "rxjs/operators";

import QrScanner from "qr-scanner";

import { store, Mutations } from "../../store";
import { getLastUrlSegment } from "../../utils";

import { StationID, runStationById } from "../../station";

interface IScanRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  downScaledWidth: number;
  downScaledHeight: number;
}

interface IDecodeSubjectValue {
  codeContent: string;
  // canvas: HTMLCanvasElement;
}
// Bundling as a blob with webpack didn't work so we get the worker code separately
QrScanner.WORKER_PATH = "js/vendor/qr-scanner-worker.min.js";

// export default defineComponent({
const Component = defineComponent({
  name: "SagaQrReader",

  data() {
    return {
      loading: true,
      result: "",
      error: "",
      onDecodeSubject: new Subject<IDecodeSubjectValue>(),
    };
  },

  // Most setup happens here where we have access to this
  mounted() {
    // Get the video element
    const videoElement = <HTMLVideoElement>document.getElementById("qrvideo");

    // Setup the scanner

    // console.log("videoElement.getClientRects: ", videoElement.getClientRects());
    // console.log(
    //   "videoElement.getBoundingClientRect: ",
    //   videoElement.getBoundingClientRect()
    // );
    // console.log(videoElement.videoWidth, videoElement.videoHeight);

    /**
     * This will set the scan region to the entire video area
     * @param videoElem
     */
    const getScanregion = function (videoElem: HTMLVideoElement) {
      const result = {
        x: 0,
        y: 0,
        width: videoElem.videoWidth,
        height: videoElem.videoHeight,
        downScaledWidth: videoElem.videoWidth / 2,
        downScaledHeight: videoElem.videoHeight / 2,
      };

      console.log(result);
      return result;
    };

    let qrScanner: QrScanner | null = new QrScanner(
      videoElement,

      (codeContent) => {
        // const canvas = <HTMLCanvasElement>document.getElementById("qrcanvas");

        // if (canvas) {
        // this.onDecodeSubject.next({ codeContent, canvas });
        // }
        this.onDecodeSubject.next({ codeContent });
      },
      undefined,
      getScanregion
    );

    // Start the scanner
    qrScanner.start();

    // Wait for the scanner to get ready
    // events canplay, playing and canplaythrough works in firefox desktop
    // on google chrome durationchange and loadedmetadata
    //

    // videoElement.addEventListener("loadeddata", () => {
    //   console.log(
    //     "video loadeddata fired: ",
    //     videoElement.videoWidth,
    //     videoElement.videoHeight
    //   );
    // });

    videoElement.addEventListener("canplay", () => {
      this.loading = false;

      console.log("video canplay fired");
      // const videoNominalWidth = videoElement.videoWidth;
      // const actualWidth = videoElement.offsetWidth;
      // const scalingFactor = actualWidth / videoNominalWidth;

      // eslint-disable-next-line
      // const scanRegion = (qrScanner as any)._scanRegion as IScanRegion;

      // position the scanRegion marker
      // const canvas = document.getElementById("qrcanvas");
      // if (canvas) {
      //   canvas.style.left = `${scanRegion.x * scalingFactor}px`;
      //   canvas.style.top = `${scanRegion.y * scalingFactor}px`;
      //   canvas.style.width = `${scanRegion.width * scalingFactor}px`;
      //   canvas.style.height = `${scanRegion.height * scalingFactor}px`;
      //   canvas.style.display = "block";
      // }
    });

    // capture these methods so we can use them in the rx pipeline
    const qrCodeIsValid = this.qrCodeIsValid;
    const getStationId = this.getStationId;

    // Setup our RxJS listener
    this.onDecodeSubject

      // only process when the code changes
      .pipe(distinctUntilKeyChanged("codeContent"))

      .pipe(
        tap((value: IDecodeSubjectValue) => {
          console.log("codeContent: ", value.codeContent);
        })
      )

      //
      // filter out codes that are not valid
      .pipe(filter((value) => qrCodeIsValid(value.codeContent)))

      // process what is left
      .subscribe({
        next: (value: IDecodeSubjectValue) => {
          // make the scanRegion marker green
          // value.canvas.style.backgroundColor = "green";

          // Hide the QR reader
          store.commit(Mutations.hideQRScanner);

          // Hide the option to start the QR reader
          store.commit(Mutations.hideButtonToOpenQRScanner);

          // Get the stationId
          const stationId = getStationId(value.codeContent);

          // feed the stationId to our engine
          if (stationId) {
            // remove the video/qrScanner
            if (qrScanner !== null) {
              qrScanner.destroy();
              qrScanner = null;
            }
            runStationById(stationId);
          }
        },
      });
  },

  methods: {
    // Extract stationId from the raw contents of a scanned qr code
    getStationId(codeContent: string): StationID | undefined {
      const baseUrl = this.$store.state.gameConfig?.baseUrl;

      // Basic assumption is that there is no stationId in the qr code
      let stationId = undefined;

      if (baseUrl && codeContent.startsWith(baseUrl)) {
        //Now extract the stationId
        stationId = getLastUrlSegment(new URL(codeContent)) as StationID;

        // Figure out if this represent a choice station
        const choiceInfix = this.$store.state.gameConfig?.choiceInfix;
        if (choiceInfix && stationId.indexOf(choiceInfix) !== -1) {
          const lastStationVisitedId =
            this.$store.state.user.lastStationVisitedId;

          const choice = stationId
            .split(choiceInfix)
            .filter((val) => val !== "")[0];

          stationId = (lastStationVisitedId +
            choiceInfix +
            choice) as StationID;
        }
      }
      return stationId;
    },

    // Pass content of scanned qrcode.
    // Returns true if qrcode expresss valid stationId in current game
    qrCodeIsValid(codeContent: string): boolean {
      // Basic assumption is that qr code is not valid
      let result = false;

      const stationId = this.getStationId(codeContent);
      const stations = this.$store.state.gameConfig?.stations;

      // Check that station id is in current game
      if (stations && stationId && stationId in stations) {
        result = true;
      }
      return result;
    },
  },
});

export default Component;
