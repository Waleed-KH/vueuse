import { computed, ref } from 'vue-demi'
import { isNumber, timestamp } from '@vueuse/shared'
import { useTimestamp } from '../useTimestamp'

export type StopwatchState = 'inactive' | 'active' | 'paused'

export interface UseStopwatchFnOptions {
  immediate?: boolean
  interval?: 'requestAnimationFrame' | number
  timeRound?: boolean | 'up'
  callback?: (time: number, timestamp: number) => void
}

function roundTime(time: number, interval: number, trunc = false) {
  const diff = time % interval
  const rt = time - diff

  return (trunc || ((interval - Math.abs(diff)) / interval) > 0.5) ? rt : rt + interval * Math.sign(time)
}

export function useStopwatchFn(options: UseStopwatchFnOptions = {}) {
  const {
    immediate = true,
    interval = 10,
    timeRound = true,
    callback,
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
    callback: callback ? callbackInvoke : undefined,
  })

  const acumTime = ref(0)
  const state = computed<StopwatchState>(() => isActive.value ? 'active' : (acumTime.value) ? 'paused' : 'inactive')
  const startTime = ref(now.value)
  const time = computed(() => acumTime.value + (isActive.value ? now.value - startTime.value : 0))

  function callbackInvoke(t: number) {
    callback!(time.value, t)
  }

  function reset() {
    startTime.value = now.value = timestamp()
    acumTime.value = 0
  }

  function start() {
    reset()
    tResume()
  }

  function pause() {
    tPause()
    const tn = timestamp()
    acumTime.value += (tn - startTime.value)
    callback?.(acumTime.value, tn)
  }

  function resume() {
    if (isActive.value)
      return

    startTime.value = now.value = timestamp()
    tResume()
  }

  function stop() {
    tPause()
    reset()
  }

  return {
    time: (isNumber(interval) && timeRound) ? computed(() => roundTime(time.value, interval, timeRound !== 'up')) : time,
    state,
    start,
    pause,
    resume,
    stop,
  }
}
