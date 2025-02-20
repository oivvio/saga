import { defineComponent } from "vue";

// rxjs docs says that this is the way but it does not work.
// So we pinned rxjs to an older version (6.6.7) to get it to work
import { Subject } from "rxjs";
import { distinctUntilKeyChanged, filter, tap } from "rxjs/operators";

import { Html5QrcodeSupportedFormats, Html5Qrcode } from "html5-qrcode";
import { store, Mutations } from "../../store";
import { getLastUrlSegment, loggy } from "../../utils";

import { StationID, runStationById } from "../../station";

interface IDecodeSubjectValue {
  codeContent: string;
}

const Component = defineComponent({
  name: "SagaQrReader",

  data() {
    return {
      loading: true,
      result: "",
      error: "",
      onDecodeSubject: new Subject<IDecodeSubjectValue>(),
      scanner: undefined as undefined | Html5Qrcode,
    };
  },

  computed: {
    stationIsExecuting() {
      return store.state.user.stationIsExecuting;
    },
  },
  watch: {
    stationIsExecuting(_, newValue) {
      if (this.scanner) {
        const refToScanner = this.scanner;

        // We set a little time out on the pausing because the scanner lib displays a yellow
        // warning label telling the user that it is paused. We don't want the user to have to see this.
        if (!newValue) {
          setTimeout(() => {
            refToScanner.pause(true);
          }, 1000);
        } else {
          try {
            this.scanner.resume();
          } catch (error) {
            console.log(error);
          }
        }
      }
    },
  },
  // Most setup happens here where we have access to this
  mounted() {
    // const html5QrCode = new Html5Qrcode("reader", {
    //   formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    //   verbose: false,
    // });

    this.scanner = new Html5Qrcode("reader", {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
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

      // filter out codes that are not valid
      .pipe(filter((value) => qrCodeIsValid(value.codeContent)))

      // process what is left
      .subscribe({
        next: (value: IDecodeSubjectValue) => {
          // Hide the QR reader
          store.commit(Mutations.hideQRScanner);

          // Hide the option to start the QR reader
          // store.commit(Mutations.hideButtonToOpenQRScanner);

          // Get the stationId
          const stationId = getStationId(value.codeContent);

          // Tell our analytics
          (this as any).$gtag.pageview(stationId);

          // Tell our home made analytics
          const logData = {
            key: "SCANNED_VALID_STATION",
            payload: {
              station: stationId,
              session: this.$store.state.user.session,
            },
          };
          loggy(logData);

          // feed the stationId to our engine
          if (stationId) {
            runStationById(stationId);
          }
        },
      });

    // Now that the pipeline is set up start scanning
    this.startScan();
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

        // Pick up choiceInfix from gameConfig
        const choiceInfix = this.$store.state.gameConfig?.choiceInfix;

        const stationIdContainsChoiceInfix =
          choiceInfix && stationId.indexOf(choiceInfix) !== -1;

        if (stationIdContainsChoiceInfix) {
          const currentStationId = this.$store.state.user.currentStation;

          // Pick out the choice part (e.g. "yes" or "no", "square" or "circle"
          const choice = stationId
            .split(choiceInfix as string)
            .filter((val) => val !== "")[0];

          //Finally put together the complete stationId
          stationId = ((((currentStationId as string) +
            choiceInfix) as string) + choice) as StationID;
        }
      }
      return stationId;
    },

    // Pass content of scanned qrcode.
    // Returns true if qrcode expresss lid stationId in current game
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

    startScan() {
      const qrCodeSuccessCallback = (decodedText: string) => {
        const codeContent = decodedText;
        this.onDecodeSubject.next({ codeContent });
      };

      const qrCodeErrorCallback = () => {
        //  Do nothing on qrErrors
      };

      const qrConfig = {
        //fps: 20, // defaults to 2 fps
        //fps: 200, // defaults to 2 fps
        fps: 60, // defaults to 2 fps
        qrbox: { width: 250, height: 250 },
        // qrbox: { width: 100, height: 100 },
        disableFlip: true,
        facingMode: "environment",
        rememberLastUsedCamera: true,
      };

      //html5QrCode.start(

      this.scanner?.start(
        { facingMode: "environment" },
        qrConfig,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      );
    },
  },
});

export default Component;
