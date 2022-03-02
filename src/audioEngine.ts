// import { Howl } from "howler";
import { StationID } from "./station";
import { IEventPlayAudio, IEventPlayBackgroundAudio } from "./event";
import { Mutations, store } from "./store";
import { joinPaths } from "./utils";
import { Subject, Observable, throwError, fromEvent, Subscription } from "rxjs";
import {
  delay,
  distinctUntilChanged,
  map,
  mergeWith,
  takeUntil,
  // tap,
  timeout,
  first,
} from "rxjs/operators";

// const htmlMediaEvents = [
//   // "abort",
//   "canplay", // keep
//   // "canplaythrough",
//   // "durationchange",
//   // "emptied",
//   // "ended",
//   // "error",
//   // "loadeddata",
//   // "loadedmetadata",
//   // "loadstart",
//   // "pause",
//   // "play",
//   // "playing",
//   // "progress",
//   // "ratechange",
//   // "resize",
//   // "seeked",
//   // "seeking",
//   // "stalled",
//   // "suspend",
//   "timeupdate", // keep
//   // "volumechange",
//   // "waiting",
// ];

// https://refactoring.guru/design-patterns/singleton/typescript/example
export class AudioEngine {
  private static instance: AudioEngine;
  // private static bgDuckedVolume = 0.075;
  // private static bgDuckedVolume = 0.15;
  // private static bgFullVolume = 1;
  private static bgFadeInDuration = 1000;
  private static bgFadeOutDuration = 2000;

  private foregroundSound: HTMLAudioElement = new Audio();
  private backgroundSoundsCount: number = 0;
  private backgroundSounds: {
    stationId: StationID;
    event: IEventPlayBackgroundAudio;
    // sound: Howl;
    sound: HTMLAudioElement;
  }[] = [];

  private backgroundTimeouts: {
    stationId: StationID;
    event: IEventPlayBackgroundAudio;
    timeoutID: number;
  }[] = [];
  // Constructor needs to be private so that instances can not be made with new AudioEventHandler()
  // eslint-disable-next-line
  private constructor() {
    // Listen for the pause event
    // These events fire when an incoming phone call is made, when the user plays audio in some other app and on some
    // other occations that are not in our control

    this.foregroundSound.addEventListener("pause", (event) => {
      console.log(`A pause event fired: ${event}`);
      if (store.state.user.hasPlayedTutorial) {
        console.log(`And the tutorial is complete.`);
        try {
          // We have to wait a bit because the pause event will fire before the onended eventlistener has run
          setTimeout(() => {
            const timeSinceLastPauseEventMarker =
              new Date().getTime() -
              store.state.audioPauseEventMarker.getTime();
            console.log("delta: ", timeSinceLastPauseEventMarker);

            if (timeSinceLastPauseEventMarker > 2000) {
              store.commit(Mutations.setAudioPausedByExternalForces, true);
            }
          }, 500);
        } catch (error) {
          console.log(error);
        } finally {
          console.log("done");
        }
      }
    });

    this.foregroundSound.addEventListener("play", (event) => {
      console.log(`A play event fired ${event}`);

      // Since we are playing we should not display the "Unpause" button
      store.commit(Mutations.setAudioPausedByExternalForces, false);
    });
  }

  private unsetStationIsExecutingWithDelay(delay: number) {
    // Wait for a while, then check if something else is playing
    // eslint-disable-next-line
    const audioEngineInstance = this;
    setTimeout(function () {
      // If we think that some audio is playing please wait
      if (store.state.audio.foreground.isPlaying) {
        console.log("foreground isPlaying so we wait another round.");
        audioEngineInstance.unsetStationIsExecutingWithDelay(delay);
      } else {
        console.log("no foreground isPlaying so we open the scanner");
        store.commit(Mutations.setStationIsExecuting, false);
      }
    }, delay);
  }

  private updateBackgroundSoundIsPlaying() {
    if (this.backgroundSoundsCount < 0) {
      // We should not get to this state
      this.backgroundSoundsCount = 0;
    }

    const value = this.backgroundSoundsCount !== 0;

    console.log("bgSoundsCount: ", this.backgroundSoundsCount);
    store.commit(Mutations.setAudioBackgroundIsPlaying, value);
  }

  private getAudioPath(filename: string): string {
    let result = "";
    if (store.state.gameConfig) {
      result = joinPaths([store.state.gameConfig.audioFileUrlBase, filename]);
    } else {
      // TODO fire some error log and display error on screen.
      console.log("THIS SHOULD NOT HAPPEN");
    }
    return result;
  }

  // always return the same instance
  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public resume(): void {
    // Run this when returning to the game after being paused by external forces
    this.foregroundSound.play();
  }

  public handleHelpAudio(audioFilename: string): void {
    this.playForegroundAudio(audioFilename, 0);
  }

  public playSilenceToAppeaseiOS(): void {
    // iOS Safari you little shirbird. This is for you.

    this.foregroundSound.autoplay = true;
    this.foregroundSound.src =
      "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
    store.commit(Mutations.setIgnorePauseEventMarker, new Date());

    this.foregroundSound.load();
    // Give that commit a sec to get done
    setTimeout(() => {
      this.foregroundSound.play();
    }, 1000);
  }

  public playForegroundAudio(
    audioFilename: string,
    wait: number,
    position = 0
  ): Promise<boolean> {
    // let audioFilenameToActuallyPlay = audioFilename;
    // if (store.state.debugQuickAudio) {
    //   audioFilenameToActuallyPlay = "/audio/beep.mp3";
    // }
    // const fullAudioPath = this.getAudioPath(audioFilenameToActuallyPlay);

    //const subscriptions: Subscription[] = [];
    const subscriptions: Subscription[] = [];

    // Let's set the timeout to 10 seconds for now.
    const TIMEOUT = 10000;
    // const TIMEOUT = 1000; // use this in dev
    let currentTimeOrZero = 0;
    const promise = new Promise<boolean>((resolve, reject) => {
      if (store.state.audio.foreground.isPlaying) {
        // TODO log error
        reject(false);
      }

      // playintent
      const playintent$ = new Subject<boolean>();

      playintent$.pipe(first()).subscribe(() => {
        // Tell the store that a station is executing
        store.commit(Mutations.setStationIsExecuting, true);
      });

      // canplay
      const canplay$ = fromEvent(this.foregroundSound, "canplay");
      canplay$
        .pipe(first())
        .pipe(delay(wait * 1000))
        .subscribe(() => {
          if (position !== 0) {
            this.foregroundSound.currentTime = position;
          }
          console.log("canplay: ", audioFilename);
          this.foregroundSound.play();
          store.commit(Mutations.setForegroundAudioIsPlaying, true);
          store.commit(Mutations.setCurrentAudioFilename, audioFilename);
        });

      // timeupdate
      const timeupdate$ = fromEvent(this.foregroundSound, "timeupdate");

      // ended
      const ended$ = fromEvent(this.foregroundSound, "ended");

      // currenttime - how far in the file we've come - filter out anything that is not progress
      const currentTime$: Observable<number> = timeupdate$
        .pipe(map((event) => (event as any).target.currentTime))
        .pipe(distinctUntilChanged());

      // currentTimeOrZero is needed when we get a network timeout

      subscriptions.push(
        currentTime$.subscribe((value) => (currentTimeOrZero = value))
      );

      const canplayAndCurrentTime$ = canplay$.pipe(mergeWith(currentTime$));

      class CustomTimeoutError extends Error {
        constructor() {
          super("Playing a file timed out.");
          this.name = "CustomTimeoutError";
        }
      }

      ended$.pipe(first()).subscribe(() => {
        store.commit(Mutations.setForegroundAudioIsPlaying, false);
        store.commit(Mutations.setCurrentAudioFilename, null);
        store.commit(Mutations.pushToPlayedForegroundAudio, audioFilename);

        // The audio ending fires
        store.commit(Mutations.setIgnorePauseEventMarker, new Date());

        this.unsetStationIsExecutingWithDelay(2500);
        console.log("resolve: ", audioFilename);

        subscriptions.forEach((subscription) => subscription.unsubscribe());

        resolve(true);
      });

      subscriptions.push(
        canplayAndCurrentTime$
          .pipe(takeUntil(ended$))
          .pipe(
            timeout({
              each: TIMEOUT,
              with: () => throwError(new CustomTimeoutError()),
            })
          )
          .subscribe(
            () => {}, // Do nothing when everything is fine
            (error) => {
              // In here we need to do something to tell the system to prompt the user
              console.log("error captured: ", error);
              // Make sure the audio does not start again when network recovers before user had
              // interacted with prompt
              // this.foregroundSound.pause();
              this.foregroundSound.src = "";
              // this.foregroundSound = null;

              store.commit(Mutations.setForegroundAudioIsPlaying, false);
              store.commit(Mutations.setCurrentAudioFilename, null);
              store.commit(Mutations.setAudioTimeout, {
                position: currentTimeOrZero,
                audioFilename: audioFilename,
              });
            }
          )
      );

      let audioFilenameToActuallyPlay = audioFilename;
      if (store.state.debugQuickAudio) {
        audioFilenameToActuallyPlay = "/audio/beep.mp3";
      }

      const fullAudioPath = this.getAudioPath(audioFilenameToActuallyPlay);
      this.foregroundSound.autoplay = true; // For iOS
      this.foregroundSound.src = fullAudioPath;

      this.foregroundSound.load();

      // After all this elaborate setup. Kick of the playing.
      playintent$.next(true);
    });
    return promise;
  }

  /**
   *
   * @param audioFilenames
   *
   * play one or more consecutive audioFiles
   */
  public playMultipleForegroundAudio(audioFilenames: string[]): void {
    store.commit(Mutations.setStationIsExecuting, true);

    //1. Check that no other main audio is playing
    if (store.state.audio.foreground.isPlaying) {
      // TODO log error
      return undefined;
    }

    if (audioFilenames.length > 0) {
      const audioFilename = audioFilenames[0];
      // setup the sound

      this.foregroundSound.src = this.getAudioPath(audioFilename);
      this.foregroundSound.autoplay = true;

      const foregroundSound = this.foregroundSound;

      if (foregroundSound) {
        // Listen for the 'canplay' event
        foregroundSound.oncanplay = () => {
          foregroundSound.play();
          store.commit(Mutations.setForegroundAudioIsPlaying, true);
          store.commit(Mutations.setCurrentAudioFilename, audioFilename);
        };

        // Listen for the 'ended' event
        foregroundSound.onended = () => {
          store.commit(Mutations.setForegroundAudioIsPlaying, false);
          store.commit(Mutations.setCurrentAudioFilename, null);
          store.commit(Mutations.pushToPlayedForegroundAudio, audioFilename);

          store.commit(Mutations.setIgnorePauseEventMarker, new Date());
          // this.unduckBackgroundAudio();

          // Remove the first element an run again.
          audioFilenames.shift();
          if (audioFilenames.length > 0) {
            this.playMultipleForegroundAudio(audioFilenames);
          } else {
            // We are at the end
            this.unsetStationIsExecutingWithDelay(2500);
          }
        };
      }
    }
  }

  public handlePlayAudioEvent(event: IEventPlayAudio): Promise<boolean> {
    // TODO For now just grab the first audio
    const filename = event.audioFilenames[0];
    const wait = event.wait;
    const promise = this.playForegroundAudio(filename, wait);
    return promise;
  }

  public stop(sound: HTMLMediaElement, _: number) {
    sound.pause();
  }

  public playWithDelay(
    sound: HTMLMediaElement,
    _: number,
    wait: number
  ): number {
    return setTimeout(() => {
      sound.play();
    }, wait * 1000) as unknown as number;
  }

  public handlePlayBackgroundAudioEvent(
    event: IEventPlayBackgroundAudio
  ): void {
    // Find bgSounds that we are wait to start to play
    const bgWaitsToCancel = this.backgroundTimeouts.filter(
      (bgSound) => bgSound.stationId !== store.state.user.currentStation
    );

    // Cancel them
    bgWaitsToCancel.forEach((bgWait) => {
      window.clearTimeout(bgWait.timeoutID);
    });

    // Hang on to any backgroundTimeouts we did not remove
    this.backgroundTimeouts = this.backgroundTimeouts.filter(
      (bgSound) => bgSound.stationId === store.state.user.currentStation
    );

    // Find bgSounds that are not from the current station
    const bgSoundsToCancel = this.backgroundSounds.filter(
      (bgSound) => bgSound.stationId !== store.state.user.currentStation
    );

    // Kill them
    bgSoundsToCancel.forEach((bgSound) => {
      this.stop(bgSound.sound, AudioEngine.bgFadeOutDuration);
    });

    // Update the count
    this.backgroundSoundsCount -= bgSoundsToCancel.length;
    this.updateBackgroundSoundIsPlaying();

    // And update our list of current background sounds
    this.backgroundSounds = this.backgroundSounds.filter(
      (bgSound) => bgSound.stationId === store.state.user.currentStation
    );

    // Setup the current background sound
    const backgroundSound = new Audio();
    backgroundSound.src = this.getAudioPath(event.audioFilename);

    // Load sound before playing asynchronously later
    // https://arrangeactassert.com/posts/how-to-fix-the-request-is-not-allowed-by-the-user-agent-or-the-platform-in-the-current-context-possibly-because-the-user-denied-permission/
    backgroundSound.load();

    backgroundSound.addEventListener(
      "ended",
      (evt) => {
        if (event.loop) {
          const target = evt.target as HTMLMediaElement;
          target.currentTime = 0;
          target.play();
        } else {
          this.backgroundSoundsCount -= 1;
          this.updateBackgroundSoundIsPlaying();
        }
      },
      false
    );

    // Add this backgroundSound to our list of backgroundSounds
    if (store.state.user.currentStation) {
      this.backgroundSounds.push({
        stationId: store.state.user.currentStation,
        event: event,
        sound: backgroundSound,
      });
      this.backgroundSoundsCount += 1;
      this.updateBackgroundSoundIsPlaying();
    }

    // eslint-disable-next-line
    console.log(
      "play background: ",
      backgroundSound.src,
      event.wait,
      this.backgroundSoundsCount
    );

    // Set up the play and get a timeout id
    const timeoutID = this.playWithDelay(
      backgroundSound,
      AudioEngine.bgFadeInDuration,
      event.wait
    );

    // Hang on to the timeout id
    if (store.state.user.currentStation) {
      this.backgroundTimeouts.push({
        stationId: store.state.user.currentStation,
        event,
        timeoutID,
      });
    }
  }

  // Check for background sounds that should be cancelled
  // when leaving the station that started them.
  public cancelDueBackgroundSounds(): void {
    // Find bgSounds that are not from the current station and
    // Should be cancelled when "their" station is no longer current

    const bgSoundsToCancel = this.backgroundSounds.filter((bgSound) => {
      return (
        bgSound.stationId !== store.state.user.currentStation &&
        bgSound.event.cancelOnLeave
      );
    });

    console.log("bgSoundsToCancel: ", bgSoundsToCancel);
    // Kill them
    bgSoundsToCancel.forEach((bgSound) => {
      this.stop(bgSound.sound, AudioEngine.bgFadeOutDuration);
    });

    // And remove them from our list of bgSounds
    this.backgroundSounds = this.backgroundSounds.filter(
      (bgSound) => !bgSoundsToCancel.includes(bgSound)
    );

    // Update the count
    this.backgroundSoundsCount -= bgSoundsToCancel.length;
  }
}
