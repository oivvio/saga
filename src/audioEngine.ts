import { Howl } from "howler";
import { StationID } from "./station";
import { IEventPlayAudio, IEventPlayBackgroundAudio } from "./event";
import { Mutations, store } from "./store";
import { joinPaths } from "./utils";

// declare function unmute(): void;
// import { unmute } from "./vendor/unmute";

// Howler.autoUnlock = true;

// https://refactoring.guru/design-patterns/singleton/typescript/example
export class AudioEngine {
  private static instance: AudioEngine;
  // private static bgDuckedVolume = 0.075;
  // private static bgDuckedVolume = 0.15;
  // private static bgFullVolume = 1;
  // private static bgFadeInDuration = 2000;
  // private static bgFadeOutDuration = 2000;
  // //private foregroundSound: Howl | undefined;
  private foregroundSound: HTMLAudioElement = new Audio();

  private backgroundSounds: {
    stationId: StationID;
    event: IEventPlayBackgroundAudio;
    sound: Howl;
  }[] = [];
  // Constructor needs to be private so that instances can not be made with new AudioEventHandler()
  // eslint-disable-next-line
  private constructor() {
    console.log("In Audioengine construtor");

    this.foregroundSound.addEventListener("pause", (event) => {
      console.log(`A pause event fired`);
      if (store.state.user.hasPlayedTutorial) {
        console.log(`And the tutorial is complete.`);
        store.commit(Mutations.setAudioPausedByExternalForces, true);
      }
    });

    this.foregroundSound.addEventListener("play", (event) => {
      console.log(`A play event fired`);

      // Since we are playing we should not display the "Unpause" button
      store.commit(Mutations.setAudioPausedByExternalForces, false);
    });
  }

  // private duckBackgroundAudio() {
  //   this.backgroundSounds.forEach((bgSound) =>
  //     bgSound.sound.fade(
  //       AudioEngine.bgFullVolume,
  //       AudioEngine.bgDuckedVolume,
  //       AudioEngine.bgFadeOutDuration
  //     )
  //   );
  // }

  // private unduckBackgroundAudio() {
  //   this.backgroundSounds.forEach((bgSound) =>
  //     bgSound.sound.fade(
  //       AudioEngine.bgDuckedVolume,
  //       AudioEngine.bgFullVolume,
  //       AudioEngine.bgFadeInDuration
  //     )
  //   );
  // }

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
      // Enables web audio in iOS when mute switch is on.
      // unmute();
      //const context: AudioContext = new (window.AudioContext ||
      //  (window as any).webkitAudioContext)();

      // debugger;
      // unmute(context);

      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public resume() {
    // Run this when returning to the game after being paused by external forces
    this.foregroundSound.play();
  }

  public handleHelpAudio(audioFilename: string): void {
    this.playForegroundAudio(audioFilename, 0);
  }

  public playSilenceToAppeaseiOS() {
    // iOS Safari you little shirbird. This is for you.

    this.foregroundSound.autoplay = true;
    this.foregroundSound.src =
      "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
    this.foregroundSound.play();
  }
  public playForegroundAudio(
    audioFilename: string,
    wait: number
  ): Promise<boolean> {
    //1. Check that no other main audio is playing
    //

    store.commit(Mutations.setStationIsExecuting, true);

    const promise = new Promise<boolean>((resolve, reject) => {
      if (store.state.audio.foreground.isPlaying) {
        // TODO log error
        reject(false);
      }
      let audioFilenameToActuallyPlay = audioFilename;
      if (store.state.debugQuickAudio) {
        audioFilenameToActuallyPlay = "/audio/beep.mp3";
      }

      // setup the sound
      //
      // this.foregroundSound = new Howl({
      //   src: [this.getAudioPath(audioFilenameToActuallyPlay)],
      //   format: ["mp3"],
      //   html5: true,
      // });

      const fullAudioPath = this.getAudioPath(audioFilenameToActuallyPlay);

      this.foregroundSound.autoplay = true; // For iOS
      this.foregroundSound.src = fullAudioPath;

      const foregroundSound = this.foregroundSound;

      if (foregroundSound) {
        foregroundSound.autoplay = true; // for iOS
        // setup callback for start of audio
        foregroundSound.oncanplay = () => {
          setTimeout(() => {
            // this.duckBackgroundAudio();
            foregroundSound.play();
            store.commit(Mutations.setForegroundAudioIsPlaying, true);
            store.commit(Mutations.setCurrentAudioFilename, audioFilename);
          }, wait * 1000);
        };

        // setup callback for end of audio
        foregroundSound.onended = () => {
          store.commit(Mutations.setForegroundAudioIsPlaying, false);
          store.commit(Mutations.setCurrentAudioFilename, null);
          store.commit(Mutations.pushToPlayedForegroundAudio, audioFilename);
          // this.unduckBackgroundAudio();
          // this.foregroundSound?.unload();

          this.unsetStationIsExecutingWithDelay(5000);
          resolve(true);
        };
      }
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
          // this.duckBackgroundAudio();
          foregroundSound.play();
          store.commit(Mutations.setForegroundAudioIsPlaying, true);
          store.commit(Mutations.setCurrentAudioFilename, audioFilename);
        };

        // Listen for the 'ended' event
        foregroundSound.onended = () => {
          store.commit(Mutations.setForegroundAudioIsPlaying, false);
          store.commit(Mutations.setCurrentAudioFilename, null);
          store.commit(Mutations.pushToPlayedForegroundAudio, audioFilename);

          // this.unduckBackgroundAudio();

          // Remove the first element an run again.
          audioFilenames.shift();
          if (audioFilenames.length > 0) {
            this.playMultipleForegroundAudio(audioFilenames);
          } else {
            // We are at the end
            this.unsetStationIsExecutingWithDelay(5000);
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

  public handlePlayBackgroundAudioEvent(
    event: IEventPlayBackgroundAudio
  ): void {
    // Find bgSounds that are not from the current station
    const bgSoundsToCancel = this.backgroundSounds.filter(
      (bgSound) => bgSound.stationId !== store.state.user.currentStation
    );

    // Kill them
    bgSoundsToCancel.forEach((bgSound) => {
      bgSound.sound.stop();
      // bgSound.sound.unload();
    });

    // And update our list of current background sounds
    this.backgroundSounds = this.backgroundSounds.filter(
      (bgSound) => bgSound.stationId === store.state.user.currentStation
    );

    // Setup the current background sound

    const backgroundSound = new Howl({
      src: [this.getAudioPath(event.audioFilename)],
      format: ["mp3"],
      loop: event.loop,
    });

    // Add this backgroundSound to our list of backgroundSounds
    if (store.state.user.currentStation) {
      this.backgroundSounds.push({
        stationId: store.state.user.currentStation,
        event: event,
        sound: backgroundSound,
      });
    }

    // If this is not a looping sound unload it when it ends.
    if (!event.loop) {
      backgroundSound.once("end", () => {
        // backgroundSound.unload();

        // And remove it from our list of backgroundSounds
        this.backgroundSounds = this.backgroundSounds.filter(
          (bgSound) => bgSound.sound !== backgroundSound
        );
      });
    }

    // Set a timeout for when to actually play the sound
    setTimeout(() => {
      // Before hitting play check if this audio should start out ducked
      // if (store.state.audio.foreground.isPlaying) {
      //   backgroundSound.volume(AudioEngine.bgDuckedVolume);
      // }
      backgroundSound.play();
    }, event.wait * 1000);
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

    // Kill them
    bgSoundsToCancel.forEach((bgSound) => {
      bgSound.sound.stop();
      bgSound.sound.unload();
    });

    // And remove them from our list of bgSounds
    this.backgroundSounds = this.backgroundSounds.filter(
      (bgSound) => !bgSoundsToCancel.includes(bgSound)
    );
  }
}
