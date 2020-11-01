<template>
  <div id="app">
    <Tasks/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Tasks from "./components/Tasks.vue";

@Component({
  components: {
    Tasks,
  },
})
export default class App extends Vue {}
</script>

<style>
</style>
