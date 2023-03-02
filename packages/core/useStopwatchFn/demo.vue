<script setup lang="ts">
import { useStopwatchFn } from '@vueuse/core'

const { time, start, stop, pause, resume, state } = useStopwatchFn({ interval: 10, immediate: false })
</script>

<template>
  <div>
    <div class="flex items-center">
      <span class="mr-5px text-18px">Time (ms): </span>
    </div>
    <p class="text-20px font-bold text-emerald-500">
      {{ time }}
    </p>
    <button @click="start">
      {{ state === 'inactive' ? 'Start' : 'Reset' }}
    </button>
    <button v-if="state !== 'inactive'" class="red" @click="stop">
      Stop
    </button>
    <button v-if="state === 'active'" class="orange" @click="pause">
      Pause
    </button>
    <button v-if="state === 'paused'" class="orange" @click="resume">
      Resume
    </button>
  </div>
</template>
