import { computed, ref } from 'vue-demi'
import { isNumber, timestamp } from '@vueuse/shared'
import { useTimestamp } from '../useTimestamp'

export type StopwatchState = 'inactive' | 'active' | 'paused'

export interface UseStopwatchFnOptions {
  immediate?: boolean
  interval?: 'requestAnimationFrame' | number
  intervalRound?: boolean | 'truncate'
}

function roundTime(time: number, interval: number, truncate = false) {
  const diff = time % interval
  const rt = time - diff

  return (truncate || ((interval - Math.abs(diff)) / interval) > 0.5) ? rt : rt + interval * Math.sign(time)
}

export function useStopwatchFn(options: UseStopwatchFnOptions = {}) {
  const {
    immediate = true,
    interval = 1000,
    intervalRound = true,
  } = options

  const {
    timestamp: now,
    isActive,
    pause: tPause,
    resume: tResume,
  } = useTimestamp({
    interval,
    immediate,
    controls: true,
  })

  const acumTime = ref(0)
  const state = computed<StopwatchState>(() => isActive.value ? 'active' : (acumTime.value) ? 'paused' : 'inactive')
  const startTime = ref(now.value)
  const time = computed(() => acumTime.value + (isActive.value ? now.value - startTime.value : 0))

  function reset() {
    startTime.value = now.value = timestamp()
    acumTime.value = 0
  }

  function start() {
    reset()
    tResume()
  }

  function pause() {
    acumTime.value = time.value
    tPause()
  }

  function resume() {
    if (isActive.value)
      return

    startTime.value = now.value = timestamp()
    tResume()
  }

  function stop() {
    reset()
    tPause()
  }

  return {
    time: isNumber(interval) && intervalRound ? computed(() => roundTime(time.value, interval, intervalRound === 'truncate')) : time,
    state,
    start,
    pause,
    resume,
    stop,
  }
}
