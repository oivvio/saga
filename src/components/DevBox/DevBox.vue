<script lang="ts" src="./DevBox.ts"></script>

<template>
  <div class="DevBox">
    <h1>Devtools</h1>
    <table>
      <tr>
        <td>Version:</td>
        <td>{{ Version.DATE }} / {{ Version.COMMIT }}</td>
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
        <td>tags seen:</td>
        <td>{{ this.$store.state.user.tags }}</td>
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
        <td>currentlyPlayingForegroundAudio:</td>
        <td>{{ this.$store.state.audio.foreground.audioFilename }}</td>
      </tr>

      <tr>
        <td>stationIsExecuting:</td>
        <td>{{ this.$store.state.user.stationIsExecuting }}</td>
      </tr>

      <tr>
        <td>audioPausedByExternalForces:</td>

        <td>{{ this.$store.state.audioPausedByExternalForces }}</td>
      </tr>

      <tr>
        <td>openStations:</td>

        <td>
          <ul>
            <li
              v-for="station in this.$store.state.user.openStations"
              :key="station"
            >
              {{ station }}
            </li>
          </ul>
        </td>
      </tr>

      <tr>
        <td>played audiofiles</td>

        <td>
          <ul>
            <li
              v-for="audioFile in this.$store.state.audio.playedForegroundAudio"
              :key="audioFile"
            >
              {{ audioFile }}
            </li>
          </ul>
        </td>
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
        <td>timers:</td>
        <td>{{ Object.keys(this.$store.state.user.timers) }}</td>
      </tr>

      <tr>
        <td>nStations:</td>
        <td>{{ nStations }}</td>
      </tr>

      <tr>
        <td>quickAudio:</td>

        <td>
          <input type="checkbox" id="checkbox" v-model="quickAudio" />
        </td>
      </tr>
    </table>

    <h1>Open stations</h1>
    <div id="example-1" v-if="gameConfigLoaded">
      <p><strong>Execute a station</strong></p>
      <table>
        <tr
          v-for="station in this.$store.state.gameConfig.stations"
          :key="station.id"
        >
          <template v-if="stationIsOpen(station.id)">
            <td>
              <button
                v-on:click="runStationOnButtonPress(station.id, false)"
                :disabled="!this.$store.state.user.QRScannerIsDisplayed"
              >
                {{ station.id }}
              </button>
            </td>

            <td>
              <button
                v-on:click="runStationOnButtonPress(station.id, true)"
                :disabled="!this.$store.state.user.QRScannerIsDisplayed"
              >
                Force run
              </button>
            </td>

            <td>
              <button v-on:click="showQrCode(station.id)">QR</button>
            </td>
            <td
              style="
                 {
                  width: 200px;
                  display: block;
                }
              "
            >
              <qrcode-vue
                :value="this.getFullUrl(station.id)"
                :size="400"
                level="H"
                v-if="this.stationIdsToDisplayQRcodeFor.includes(station.id)"
              />
            </td>

            <td>
              <span> {{ openOrClosed(station.id) }}</span>
            </td>

            <td>
              <span> {{ visitCount(station.id) }}</span>
            </td>
          </template>
        </tr>
      </table>
    </div>

    <div id="example-1" v-if="gameConfigLoaded">
      <p><strong>Execute a station</strong></p>
      <table>
        <tr
          v-for="station in this.$store.state.gameConfig.stations"
          :key="station.id"
        >
          <td>
            <button
              v-on:click="runStationOnButtonPress(station.id, false)"
              :disabled="!this.$store.state.user.QRScannerIsDisplayed"
            >
              {{ station.id }}
            </button>
          </td>

          <td>
            <button
              v-on:click="runStationOnButtonPress(station.id, true)"
              :disabled="!this.$store.state.user.QRScannerIsDisplayed"
            >
              Force run
            </button>
          </td>

          <td>
            <button v-on:click="showQrCode(station.id)">QR</button>
          </td>
          <td
            style="
               {
                width: 200px;
                display: block;
              }
            "
          >
            <qrcode-vue
              :value="this.getFullUrl(station.id)"
              :size="400"
              level="H"
              v-if="this.stationIdsToDisplayQRcodeFor.includes(station.id)"
            />
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
  padding-bottom: 10rem;
  margin-top: 100vh;
  position: relative;
  z-index: 10;
}

td {
  border: 1px solid black;

  canvas {
    width: 200px !important;
    height: 200px !important;
  }

  button {
    height: 3rem;
    background-color: white;
    border-radius: 1rem;
  }
}
</style>
