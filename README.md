# Saga

A webb application for non-linear story telling.

# Getting started

- Clone the repo

```bash
$ git clone git@github.com:oivvio/saga.git [PROJECT_NAME]
```

- Install dependencies

```bash
$ cd PROJECT_NAME
$ npm install


```

- Make, populate & activate a python virtualenv

This assumes that `virtualenvwrapper` is installed on your system.

```bash
$ mkvirtualenv  --python=/usr/bin/python3.9 [VENV_NAME]

$ pip install -r requirements.txt
```

- Run the project i development mode

```bash
$ invoke vue-devserver
```

Navigate to `http://localhost:8080`

# Run JSON schema to validate the json documents

A game built with Saga consists of two parts: the game engine and the game definition files and audio files. The game engine is provided and it's up to you to write the game definition files and provide the audio files for your game.

We include test game in `public/data/test_game` to get you started.

The game definition files are written in `json` and we provide a set of json schema files that you should use to validate your game definition files. We provide a set of `invoke` tasks that make it easy to validate your game definition files.

Make sure your virtualenv is active.

```bash
$ workon [VENV_NAME]
```

```bash
$ invoke validate-game -f ./path/to/your/gameconfig.json
```

# Notes for version 2

Rewrite with these things in mind:

1. Separate qr-code from stationId. The same qr-code will do different things
   depending on the users current state. So for each qr-code we should be able to
   define a number of conditions that can lead to a number of different "stations".
   These conditions should work kinda like pattern matching in F#, ie they should be expressive.
2. We need a plugin system. Every game will need some logic that is specific to
   that game and we should be able to handle that in a controlled fashion rather
   than doing ugly game specific hacks in the main game engine.

3. The game config should be authored with something like
   https://github.com/jagenjo/litegraph.js And it should not be possible to
   construct an unvalid game.
