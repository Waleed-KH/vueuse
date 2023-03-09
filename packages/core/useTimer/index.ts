import { computed, ref } from 'vue-demi'
import { type MaybeComputedRef, isObject, resolveRef } from '@vueuse/shared'
import { type StopwatchState, type UseStopwatchFnOptions, useStopwatchFn } from '../useStopwatchFn'
import { type TimeSpan, useTimeSpan } from '../useTimeSpan'

export type TimerState = StopwatchState | 'finished'

export interface UseTimerOptions extends UseStopwatchFnOptions {
  stopOnFinish?: boolean
  defaultFormat?: string
}

export function useTimer(time: MaybeComputedRef<number> | TimeSpan, options: UseTimerOptions = {}) {
  const {
    stopOnFinish = true,
    defaultFormat = '-[HH\\:]mm:ss.ff',
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
  if (defaultFormat)
    timespan.setDefaultFormat(defaultFormat)

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
