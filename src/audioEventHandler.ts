import { Howl } from "howler";
import {
  IEventPlayAudio,
  IEventPlayBackgroundAudio,
  StationID,
} from "./station";
import { Mutations, store } from "./store";
import { joinPaths } from "./utils";

// https://refactoring.guru/design-patterns/singleton/typescript/example
export class AudioEventHandler {
  private static instance: AudioEventHandler;
  private static bgDuckedVolume = 0.3;
  private static bgFullVolume = 1;
  private static bgFadeInDuration = 2000;
  private static bgFadeOutDuration = 2000;
  private mainSound: Howl | undefined;
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
        AudioEventHandler.bgFullVolume,
        AudioEventHandler.bgDuckedVolume,
        AudioEventHandler.bgFadeOutDuration
      )
    );
  }

  private unduckBackgroundAudio() {
    console.log("unducking background audio");
    this.backgroundSounds.forEach((bgSound) =>
      bgSound.sound.fade(
        AudioEventHandler.bgDuckedVolume,
        AudioEventHandler.bgFullVolume,
        AudioEventHandler.bgFadeInDuration
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
  public static getInstance(): AudioEventHandler {
    if (!AudioEventHandler.instance) {
      AudioEventHandler.instance = new AudioEventHandler();
    }
    return AudioEventHandler.instance;
  }

  public handlePlayAudioEvent(event: IEventPlayAudio): void {
    const filename = event.audioFilename;

    //1. Check that no other main audio is playing
    if (store.state.audio.story.isPlaying) {
      console.log("sorry");
      return undefined;
    }

    //3. Play audio until end
    this.mainSound = new Howl({
      src: [this.getAudioPath(filename)],
      html5: true, // Stream (i.e.) start playing before downloaded
    });

    //this.mainSound.once("play", () => {
    //  store.commit(Mutations.setAudioStoryIsPlaying, true);
    // });

    this.mainSound.once("end", () => {
      store.commit(Mutations.setAudioStoryIsPlaying, false);
      this.unduckBackgroundAudio();
      this.mainSound?.unload();
    });

    // TODO replace with commits
    // store.state.audio.story.data = fullAudioPath;
    // store.state.audio.volume = sound.volume();

    this.duckBackgroundAudio();
    this.mainSound.play();
    store.commit(Mutations.setAudioStoryIsPlaying, true);
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
      if (store.state.audio.story.isPlaying) {
        backgroundSound.volume(AudioEventHandler.bgDuckedVolume);
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
