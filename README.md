# Saga

A webb application for non-linear story telling.

# Getting started

- Clone the repo

```bash
$ git clone https://github.com/jeneljenel/saga [PROJECT_NAME]
```

- Install dependencies

```bash
$ cd PROJECT_NAME
npm install
```

- build and run the project

```bash
$ npm start
```

Navigate to `http://localhost:8080`

# Run JSON schema to validate json documents

Activate the virtualenv.

```bash
$ source ./venv/bin/activate
```

```bash
$ python schema-validator.py
```

# Info

This project is to be used in a specific project and is very customized for the artistic ideas of the story telling.

There is an example of how to set it up saga-example.md.

# Handling state

State is initialized in main.js like so

    let initialState = stateInit();
    Alpine.store("state", initialState);

We can then pick up our current state anyware in the project like so

    let state = Alpine.store("state");

# my-project-name

# From the README.md `vue create` gave us

## Project setup

```
yarn install
```

### Compiles and hot-reloads for development

```
yarn serve
```

### Compiles and minifies for production

```
yarn build
```

### Lints and fixes files

```
yarn lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
