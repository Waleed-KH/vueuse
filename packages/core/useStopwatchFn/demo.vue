<script setup lang="ts">
// import { ref } from 'vue'
import { StopwatchState, useStopwatchFn } from '@vueuse/core'

const { timespan, start, stop, pause, resume, state } = useStopwatchFn({ interval: 100, immediate: false })
</script>

<template>
  <div>
    <div class="flex items-center">
      <span class="mr-5px text-18px">Time (ms): </span>
    </div>
    <p class="text-20px font-bold text-emerald-500">
      {{ timespan }}
    </p>
    <button @click="start">
      {{ state === StopwatchState.Inactive ? 'Start' : 'Reset' }}
    </button>
    <button v-if="state !== StopwatchState.Inactive" class="red" @click="stop">
      Stop
    </button>
    <button v-if="state === StopwatchState.Active" class="orange" @click="pause">
      Pause
    </button>
    <button v-if="state === StopwatchState.Paused" class="orange" @click="resume">
      Resume
    </button>
  </div>
</template>
