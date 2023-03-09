<script setup lang="ts">
import { useTimer } from '@vueuse/core'

const { timespan, start, stop, pause, resume, state } = useTimer(100000000, {
  interval: 10, immediate: false, stopOnFinish: false,
})
</script>

<template>
  <div>
    <div class="flex items-center">
      <span class="mr-5px text-18px">Time (ms): </span>
    </div>
    <p class="text-20px">
      <span v-if="state === 'finished'">Finished 🎉 </span>
      <span class="font-bold text-emerald-500"> {{ timespan }}</span>
    </p>
    <button @click="start">
      {{ state === 'inactive' ? 'Start' : 'Restart' }}
    </button>
    <button v-if="state !== 'inactive'" class="red" @click="stop">
      {{ state === 'finished' ? 'Reset' : 'Stop' }}
    </button>
    <button v-if="state === 'active'" class="orange" @click="pause">
      Pause
    </button>
    <button v-if="state === 'paused'" class="orange" @click="resume">
      Resume
    </button>
  </div>
</template>
