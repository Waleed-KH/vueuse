import type { ComputedRef } from 'vue-demi'
import { computed } from 'vue-demi'
import type { MaybeComputedRef } from '../utils'
import { resolveUnref } from '../resolveUnref'

/**
 * Reactive `Array.every`
 *
 * @see https://vueuse.org/useArrayEvery
 * @param {Array} list - the array was called upon.
 * @param fn - a function to test each element.
 *
 * @returns {boolean} **true** if the `fn` function returns a **truthy** value for every element from the array. Otherwise, **false**.
 */
export function useArrayEvery<T>(
  list: MaybeComputedRef<MaybeComputedRef<T>[]>,
  fn: (element: T, index: number, array: MaybeComputedRef<T>[]) => unknown,
): ComputedRef<boolean> {
  return computed(() => resolveUnref(list).every((element, index, array) => fn(resolveUnref(element), index, array)))
}
