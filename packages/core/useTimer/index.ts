import { computed, ref } from 'vue-demi'
import { type MaybeComputedRef, isNumber, isObject, resolveRef, timestamp, useIntervalFn } from '@vueuse/shared'
import { useRafFn } from '../useRafFn'
import { type TimeSpan, useTimeSpan } from '../useTimeSpan'

export enum TimerState {
  Inactive,
  Active,
  Paused,
  Finished,
}

export interface UseTimerOptions {
  immediate?: boolean
  interval?: 'requestAnimationFrame' | number
  intervalRound?: boolean
  stopOnFinish?: boolean
}

function roundTime(time: number, interval: number) {
  const diff = time % interval
  const rc = (interval - diff) / interval
  const rt = time - diff

  return (rc >= 0.35) ? rt : rt + interval
}

export function useTimer(time: MaybeComputedRef<number> | TimeSpan, options: UseTimerOptions = {}) {
  const {
    immediate = true,
    interval = 1000,
    intervalRound = true,
    stopOnFinish = true,
  } = options

  const now = ref(timestamp())
  const initialTime = (isObject(time) && 'totalMilliseconds' in time) ? time.totalMilliseconds : resolveRef(time)
  const state = ref(TimerState.Inactive)
  const startTime = ref(now.value)
  const finishTime = ref(startTime.value + initialTime.value)
  const timespan = computed(() => finishTime.value - now.value)
  const remainingTime = ref(0)

  const update = () => {
    now.value = timestamp()

    if (state.value !== TimerState.Finished && timespan.value <= 0)
      finish()
  }

  const controls = interval === 'requestAnimationFrame'
    ? useRafFn(update, { immediate: false })
    : useIntervalFn(update, interval, { immediate: false })

  function reset() {
    now.value = timestamp()
    startTime.value = now.value
    finishTime.value = startTime.value + initialTime.value
    remainingTime.value = 0
  }

  function start() {
    reset()
    state.value = TimerState.Active
    controls.resume()
  }

  function pause() {
    remainingTime.value = initialTime.value - timespan.value
    state.value = TimerState.Paused
    controls.pause()
  }

  function resume() {
    now.value = timestamp()
    startTime.value = now.value
    finishTime.value = startTime.value + remainingTime.value
    state.value = TimerState.Active
    controls.resume()
  }

  function stop() {
    reset()
    state.value = TimerState.Inactive
    controls.pause()
  }

  function finish() {
    state.value = TimerState.Finished
    if (stopOnFinish) {
      controls.pause()
      now.value = finishTime.value
    }
  }

  if (immediate)
    start()

  return {
    timespan: useTimeSpan((isNumber(interval) && intervalRound)
      ? computed(() => roundTime(timespan.value, interval))
      : timespan),
    state,
    start,
    pause,
    resume,
    stop,
  }
}
