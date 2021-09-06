<script lang="ts" src="./DevBox.ts"></script>

<template>
  <div class="DevBox">
    <h1>DevBox 1</h1>

    <form v-on:submit.prevent="onSubmit">
      <input v-model="message" />
      <div class="control">
        <button class="button is-primary">Submit</button>
      </div>
    </form>

    <p>Message is: {{ message }}</p>
  </div>
</template>

<style scoped lang="scss">
div.DevBox {
  background-color: lightgreen;
}
</style>
