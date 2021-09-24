<script lang="ts" src="./DevBox.ts"></script>

<template>
  <div class="DevBox">
    <h1>Devtools</h1>
    <table>
      <tr>
        <td>QRScannerCanBeDisplayed:</td>
        <td>{{ this.$store.state.user.QRScannerCanBeDisplayed }}</td>
      </tr>
      <tr>
        <td>QRScannerIsDisplayed:</td>
        <td>{{ this.$store.state.user.QRScannerIsDisplayed }}</td>
      </tr>

      <tr>
        <td>gameConfigIsLoaded:</td>
        <td>{{ this.$store.state.gameConfigLoaded }}</td>
      </tr>

      <tr>
        <td>stationsVisited:</td>
        <td>{{ this.$store.state.user.stationsVisited }}</td>
      </tr>
      <tr>
        <td>audioStoryIsPlaying:</td>
        <td>{{ this.$store.state.audio.foreground.isPlaying }}</td>
      </tr>
      <tr>
        <td>audioBackgroundIsPlaying:</td>
        <td>{{ this.$store.state.audio.background.isPlaying }}</td>
      </tr>

      <tr>
        <td>openStations:</td>
        <td>{{ this.$store.state.user.openStations }}</td>
      </tr>

      <tr>
        <td>lastStationVisitedId:</td>
        <td>{{ this.$store.state.user.lastStationVisitedId }}</td>
      </tr>

      <tr>
        <td>currentStation:</td>
        <td>{{ this.$store.state.user.currentStation }}</td>
      </tr>
      <tr>
        <td>helpAvailable:</td>
        <td>{{ this.$store.state.user.helpAvailable }}</td>
      </tr>
      <tr>
        <td>adHocData:</td>
        <td>{{ this.$store.state.user.adHocData }}</td>
      </tr>

      <tr>
        <td>nStations:</td>
        <td>{{ nStations }}</td>
      </tr>
    </table>

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

td {
  border: 1px solid black;
}
</style>
