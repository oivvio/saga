import { Howl } from "howler";
import {
  IEventPlayAudio,
  IEventPlayBackgroundAudio,
  StationID,
} from "./station";
import { Mutations, store } from "./store";
import { joinPaths } from "./utils";

// https://refactoring.guru/design-patterns/singleton/typescript/example
export class AudioEngine {
  private static instance: AudioEngine;
  private static bgDuckedVolume = 0; // TODO Set to 0.3
  private static bgFullVolume = 0; // TODO Set to 1
  private static bgFadeInDuration = 2000;
  private static bgFadeOutDuration = 2000;
  private foregroundSound: Howl | undefined;
  // private backgroundSounds: [StationID, Howl][];
  private backgroundSounds: {
    stationId: StationID;
    event: IEventPlayBackgroundAudio;
    sound: Howl;
  }[] = [];
  // Constructor needs to be private so that instances can not be made with new AudioEventHandler()
  // eslint-disable-next-line
  private constructor() {}

  private duckBackgroundAudio() {
    console.log("ducking background audio");
    this.backgroundSounds.forEach((bgSound) =>
      bgSound.sound.fade(
        AudioEngine.bgFullVolume,
        AudioEngine.bgDuckedVolume,
        AudioEngine.bgFadeOutDuration
      )
    );
  }

  private unduckBackgroundAudio() {
    console.log("unducking background audio");
    this.backgroundSounds.forEach((bgSound) =>
      bgSound.sound.fade(
        AudioEngine.bgDuckedVolume,
        AudioEngine.bgFullVolume,
        AudioEngine.bgFadeInDuration
      )
    );
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

  public handleHelpAudio(audioFilename: string): void {
    this.playForegroundAudio(audioFilename);
  }

  public playForegroundAudio(audioFilename: string): void {
    //1. Check that no other main audio is playing
    if (store.state.audio.foreground.isPlaying) {
      // TODO log error
      console.log("sorry");
      return undefined;
    }

    // setup the sound
    this.foregroundSound = new Howl({
      src: [this.getAudioPath(audioFilename)],
      html5: true, // Stream (i.e.) start playing before downloaded
    });

    // setup callback for start of audio
    this.foregroundSound.once("play", () => {
      this.duckBackgroundAudio();
      store.commit(Mutations.setForegroundAudioIsPlaying, true);
    });

    // setup callback for end of audio
    this.foregroundSound.once("end", () => {
      store.commit(Mutations.setForegroundAudioIsPlaying, false);
      this.unduckBackgroundAudio();
      this.foregroundSound?.unload();
    });

    // Press play
    this.foregroundSound.play();
  }

  /**
   *
   * @param audioFilenames
   *
   * play one or more consecutive audioFiles
   */
  public playMultipleForegroundAudio(audioFilenames: string[]): void {
    //1. Check that no other main audio is playing
    if (store.state.audio.foreground.isPlaying) {
      // TODO log error
      console.log("sorry");
      return undefined;
    }

    if (audioFilenames.length > 0) {
      const audioFilename = audioFilenames[0];
      // setup the sound
      this.foregroundSound = new Howl({
        src: [this.getAudioPath(audioFilename)],
        html5: true, // Stream (i.e.) start playing before downloaded
      });

      // setup callback for start of audio
      this.foregroundSound.once("play", () => {
        this.duckBackgroundAudio();
        store.commit(Mutations.setForegroundAudioIsPlaying, true);
      });

      // setup callback for end of audio
      this.foregroundSound.once("end", () => {
        store.commit(Mutations.setForegroundAudioIsPlaying, false);
        this.unduckBackgroundAudio();
        this.foregroundSound?.unload();

        // Remove the first element an run again.
        audioFilenames.shift();
        if (audioFilenames.length > 0) {
          this.playMultipleForegroundAudio(audioFilenames);
        }
      });

      // Press play
      this.foregroundSound.play();
    }
  }

  public handlePlayAudioEvent(event: IEventPlayAudio): void {
    // TODO For now just grab the first audio
    const filename = event.audioFilenames[0];
    this.playForegroundAudio(filename);
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
      bgSound.sound.unload();
    });

    // And update our list of current background sounds
    this.backgroundSounds = this.backgroundSounds.filter(
      (bgSound) => bgSound.stationId === store.state.user.currentStation
    );

    // Setup the current background sound
    const backgroundSound = new Howl({
      src: [this.getAudioPath(event.audioFilename)],
      html5: true, // Stream (i.e.) start playing before downloaded
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
        backgroundSound.unload();

        // And remove it from our list of backgroundSounds
        this.backgroundSounds = this.backgroundSounds.filter(
          (bgSound) => bgSound.sound !== backgroundSound
        );
      });
    }

    // Set a timeout for when to actually play the sound
    setTimeout(() => {
      // Before hitting play check if this audio should start out ducked
      if (store.state.audio.foreground.isPlaying) {
        backgroundSound.volume(AudioEngine.bgDuckedVolume);
      }
      backgroundSound.play();
    }, event.wait * 1000);
  }

  // Check for background sounds that should be cancelled
  // when leaving the station that started them.
  public cancelDueBackgroundSounds(): void {
    console.log("cancel due bg sounds");

    // Find bgSounds that are not from the current station and
    // should be cancelled when "their" station is no longer current
    const bgSoundsToCancel = this.backgroundSounds.filter(
      (bgSound) =>
        bgSound.stationId !== store.state.user.currentStation &&
        bgSound.event.cancelOnLeave
    );

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
