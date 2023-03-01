import { computed, ref } from 'vue-demi'
import { isNumber, timestamp } from '@vueuse/shared'
import { useTimestamp } from '../useTimestamp'

export enum StopwatchState {
  Inactive,
  Active,
  Paused,
}

export interface UseStopwatchFnOptions {
  immediate?: boolean
  interval?: 'requestAnimationFrame' | number
}

function roundTime(time: number, interval: number) {
  const diff = time % interval
  const rc = (interval - diff) / interval
  const rt = time - diff

  return (rc >= 0.35) ? rt : rt + interval
}

export function useStopwatchFn(options: UseStopwatchFnOptions = {}) {
  const {
    immediate = true,
    interval = 1000,
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
  const state = computed(() => isActive.value ? StopwatchState.Active : acumTime.value ? StopwatchState.Paused : StopwatchState.Inactive)
  const startTime = ref(now.value)
  const timespan = computed(() => acumTime.value + (isActive.value ? now.value - startTime.value : 0))

  function reset() {
    now.value = startTime.value = timestamp()
    acumTime.value = 0
  }

  function start() {
    reset()
    tResume()
  }

  function pause() {
    acumTime.value = timespan.value
    tPause()
  }

  function resume() {
    if (isActive.value)
      return

    now.value = startTime.value = timestamp()
    tResume()
  }

  function stop() {
    reset()
    tPause()
  }

  return {
    timespan: isNumber(interval)
      ? computed(() => roundTime(timespan.value, interval))
      : timespan,
    state,
    start,
    pause,
    resume,
    stop,
  }
}
