import { computed, ref } from 'vue-demi'
import { type MaybeComputedRef, isObject, resolveRef } from '@vueuse/shared'
import { type StopwatchState, type UseStopwatchFnOptions, useStopwatchFn } from '../useStopwatchFn'
import { type TimeSpan, useTimeSpan } from '../useTimeSpan'

export type TimerState = StopwatchState | 'finished'

export interface UseTimerOptions extends UseStopwatchFnOptions {
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
    stopOnFinish = true,
  } = options

  const {
    time: rTime,
    state: rState,
    start: rStart,
    pause,
    resume,
    stop: rStop,
  } = useStopwatchFn({ ...options, callback: update })

  const itime = (isObject(time) && 'totalMilliseconds' in time) ? time.totalMilliseconds : resolveRef(time)
  const finished = ref(itime.value <= 0)
  const stime = computed(() => (finished.value && stopOnFinish) ? 0 : itime.value - rTime.value)
  const state = computed<TimerState>(() => finished.value ? 'finished' : rState.value)

  function update() {
    if (!finished.value && stime.value <= 0) {
      finished.value = true
      if (stopOnFinish)
        rStop()
    }
  }

  function reset() {
    finished.value = false
  }

  const timespan = useTimeSpan(stime)

  return {
    timespan,
    state,
    start() {
      reset()
      rStart()
    },
    pause,
    resume,
    stop() {
      reset()
      rStop()
    },
  }
}
