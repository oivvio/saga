# Saga

How to set it up and play

# Audio

`data/audio` directory for audiofiles. Support only for mp3 at the moment.

`data/stations` station info in json structure.
Each station holds an `"id":` the unique id for the station which is also your QR code.

User can not re-scan an already scanned station.
If user scan a already visited station a help-file will be played.

`"level":` will load different backgroundstracks.

## Basic audio play

```json
{
  "id": "play-audio",
  "name": "play simple audio",
  "tags": ["story"],
  "events": [
    {
      "station_id": "1",
      "action": "playAudio",
      "audioType": "story",
      "audioFilename": "audio-test-1_converted.WebM"
    }
  ]
}
```

## Audio play with timertriggered event

```json
{
  "id": "play-audio-timer",
  "name": "play simple audio with timers.",
  "tags": ["story", "timer"],
  "events": [
    {
      "station_id": "1",
      "action": "playAudio",
      "audioType": "story",
      "audioFilename": "saga-1_converted.WebM"
    },
    {
      "action": "startTimeLimit",
      "timername": "timer-help-1",
      "cancelOnLeave": true,
      "timeLimit": 16,
      "timeLimitEnd": {
        "action": "playAudio",
        "audioType": "timerhelp",
        "audioFilename": "timerhelp-test-1_converted.WebM"
      }
    },
    {
      "action": "startTimeLimit",
      "timername": "timer-story-1-2",
      "cancelOnLeave": true,
      "timeLimit": 20,
      "timeLimitEnd": {
        "action": "goToStation",
        "toStation": "play-audio-timer-2"
      }
    }
  ]
}
```

`cancelOnLeave` if true, the timer will auto cancel when leaving the station.
`timeLimit` in seconds.
`timeLimitEnd` action when timer ends.

Note if timer is not off it can go off later in the game. Make sure to handle your timers.

## Cancel timers

```json
{
  "id": "play-timer",
  "level": 1,
  "name": "play audio. starts a level timer end when leaving level 1.",
  "tags": ["play-timer-1"],
  "events": [
    {
      "station_id": "1",
      "action": "playAudio",
      "audioType": "story",
      "audioFilename": "audio-test-1_converted.WebM"
    },
    {
      "action": "startTimeLimit",
      "timerName": "timer-level-1",
      "timeLimit": 20,
      "timeLimitEnd": {
        "action": "goToStation",
        "toStation": "play-audio-end-1"
      }
    },
    {
      "action": "startTimeLimit",
      "timerName": "timer-story-1-2",
      "cancelOnLeave": true,
      "timeLimit": 10,
      "timeLimitEnd": {
        "action": "goToStation",
        "toStation": "play-timer-2"
      }
    }
  ]
}
```

Will start two timers `timer-level-1`and `timer-story-1-2`. The first will throw the user to station `play-audio-end-2` if not canceled and the second timer will push user to next station.

```json
{
  "id": "play-audio-end-2",
  "level": 2,
  "name": "play audio and cancel the timer",
  "tags": ["play-timer-2"],
  "events": [
    {
      "station_id": "2",
      "condition": "hasTag",
      "conditionArgs": "play-timer-1",
      "action": "playAudio",
      "audioType": "story",
      "audioFilename": "end-2_converted.WebM"
    },
    {
      "action": "cancelTimer",
      "timerName": "level-timer-1"
    }
  ]
}
```

# User data and conditions

Each story track will run depending on different conditions and tags.
`user.tags` holds all tags users collects when entering a station wheras each station can hold a conditionArgs such as `hasTag`.

_Work in process_
