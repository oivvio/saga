import { Howl } from "howler";
// import urljoin from "url-join";
import {
  IEventPlayAudio,
  IEventPlayBackgroundAudio,
  interpretStation,
  StationID,
} from "./station";
import { Mutations, store } from "./store";
import { log, joinPaths } from "./utils";

// const AUDIOFILEBASE = "data/";

export function runStation(stationId: StationID): void {
  log("engine", ` runStation: ${stationId}`);
  // Get the current state
  //   const state = getState();

  // set the currently executing station
  store.commit(Mutations.setCurrentStation, stationId);
  // Figure out which stations are visited
  const visitedStationIds = store.state.user.stationsVisited;

  // If we have already been here

  if (visitedStationIds.includes(stationId)) {
    // if (store.state.user.helpAvailable <= 0) {
    //   console.warn("User has no more available helptracks");
    // } else {
    //     "User already visited this story. Playing helpfile: ",
    //     store.state.user.helpAvailable
    //   );
    //   playAudio("help-" + store.state.user.helpAvailable + ".mp3");
    //   store.commit(Mutations.decreaseHelpAvailable);
    // }
  } else {
    // If we have NOT already been here

    if (store?.state?.gameConfig) {
      const station = store.state.gameConfig.stations[stationId];

      // Will also play audio
      interpretStation(store.state, station);
    }
  }
}

export function playAudioFile(filename: string): Howl | undefined {
  // Some other audio is playing so we do to nothing
  if (!store.state.audio.story.isPlaying) {
    // create a new audioElement
    // const fullAudioPath = AUDIOFILEBASE + filename;
    let fullAudioPath = "";
    if (store.state.gameConfig) {
      fullAudioPath = joinPaths([
        store.state.gameConfig.audioFileUrlBase,
        filename,
      ]);
    } else {
      // TODO fire some error log and display error on screen.
    }

    store.state.audio.story.isPlaying = false;

    const sound = new Howl({
      src: [fullAudioPath],
      html5: true, // Stream (i.e.) start playing before downloaded
    });

    sound.once("play", () => {
      store.commit(Mutations.setAudioStoryIsPlaying, true);
    });

    sound.once("end", () => {
      console.log("AUDIO END");
      store.commit(Mutations.setAudioStoryIsPlaying, false);
      // sound.unload();
    });

    // TODO replace with commits
    store.state.audio.story.data = fullAudioPath;
    store.state.audio.volume = sound.volume();

    sound.play();
    return sound;
  }
}

export function handleBackgroundAudioRequest(
  filename: string,
  loop: boolean
): void {
  // Some other audio is playing so we do to nothing
  if (!store.state.audio.story.isPlaying) {
    // create a new audioElement
    // const fullAudioPath = AUDIOFILEBASE + filename;
    let fullAudioPath = "";
    if (store.state.gameConfig) {
      fullAudioPath = joinPaths([
        store.state.gameConfig.audioFileUrlBase,
        filename,
      ]);
    } else {
      // TODO fire some error log and display error on screen.
    }

    store.state.audio.story.isPlaying = false;

    const sound = new Howl({
      src: [fullAudioPath],
      loop: loop,
      html5: true, // Stream (i.e.) start playing before downloaded
    });

    sound.once("play", () => {
      store.commit(Mutations.setAudioStoryIsPlaying, true);
    });

    sound.once("end", () => {
      console.log("AUDIO END");
      store.commit(Mutations.setAudioStoryIsPlaying, false);
      // sound.unload();
    });

    // TODO replace with commits
    store.state.audio.story.data = fullAudioPath;
    store.state.audio.volume = sound.volume();

    sound.play();
  }
}

// https://refactoring.guru/design-patterns/singleton/typescript/example
export class AudioEventHandler {
  private static instance: AudioEventHandler;

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
  }

  private unduckBackgroundAudio() {
    console.log("unducking background audio");
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

  public handlePlayAudioEvent(event: IEventPlayAudio) {
    const filename = event.audioFilenames[0];

    //1. Check that no other main audio is playing
    if (store.state.audio.story.isPlaying) {
      console.log("sorry");
      return undefined;
    }

    //2. If backgroundAudio is playing duck that.
    // TODO

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

  public handlePlayBackgroundAudioEvent(event: IEventPlayBackgroundAudio) {
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
