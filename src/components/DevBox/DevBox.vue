<script lang="ts" src="./DevBox.ts"></script>

<template>
  <div class="DevBox">
    <h1>Devtools</h1>
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
    <p>
      audioStoryIsPlaying: {{ this.$store.state.audio.foreground.isPlaying }}
    </p>
    <p>
      audioBackgroundIsPlaying:
      {{ this.$store.state.audio.background.isPlaying }}
    </p>

    <p>openStations: {{ this.$store.state.user.openStations }}</p>
    <p>currentStation: {{ this.$store.state.user.currentStation }}</p>
    <p>helpAvailable: {{ this.$store.state.user.helpAvailable }}</p>
    <p>adHocData: {{ this.$store.state.user.adHocData }}</p>

    <p>nStations: {{ nStations }}</p>

    <div id="example-1" v-if="gameConfigLoaded">
      <p><strong>Execute a station</strong></p>
      <table>
        <tr
          v-for="station in this.$store.state.gameConfig.stations"
          :key="station.id"
        >
          <td>
            <button
              v-on:click="runStationOnButtonPress(station.id)"
              :disabled="!this.$store.state.user.QRScannerCanBeDisplayed"
            >
              {{ station.id }}
            </button>
          </td>

          <td>
            <span> {{ openOrClosed(station.id) }}</span>
          </td>

          <td>
            <span> {{ visitCount(station.id) }}</span>
          </td>
        </tr>
      </table>
    </div>
    <p><strong>Reset</strong></p>
    <button v-on:click="wipeHistory">Wipe history</button>
  </div>
</template>

<style scoped lang="scss">
div.DevBox {
  background-color: lightgreen;
}
</style>
