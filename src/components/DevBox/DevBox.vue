<script lang="ts" src="./DevBox.ts"></script>

<template>
  <div class="DevBox">
    <h1>Devtools</h1>

    <form v-on:submit.prevent="onSubmit">
      <input v-model="message" />
      <div class="control">
        <button>Play from this station</button>
      </div>
    </form>

    <p>Message is: {{ message }}</p>
    <p>
      QRScannerCanBeDisplayed:
      {{ this.$store.state.user.QRScannerCanBeDisplayed }}
    </p>
    <p>
      QRScannerIsDisplayed: {{ this.$store.state.user.QRScannerIsDisplayed }}
    </p>

    <p>gameConfigIsLoaded: {{ this.$store.state.gameConfigLoaded }}</p>
    <p>stationsVisited: {{ this.$store.state.user.stationsVisited }}</p>

    <p>timers: {{ this.$store.state.user.timers }}</p>
    <p>audioStoryIsPlaying: {{ this.$store.state.audio.story.isPlaying }}</p>
    <p>
      audioBackgroundIsPlaying:
      {{ this.$store.state.audio.background.isPlaying }}
    </p>

    <p>
      displayDevBox:
      {{ this.$store.state.displayDevBox }}
    </p>

    <button v-on:click="wipeHistory">Wipe history</button>
  </div>
</template>

<style scoped lang="scss">
div.DevBox {
  background-color: lightgreen;
}
</style>
