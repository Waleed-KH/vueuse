import type { ComputedRef, Ref, WritableComputedRef } from 'vue-demi'
import { computed, ref, watch } from 'vue-demi'
import { tryOnMounted } from '@vueuse/shared'
import { type StorageLike, getSSRHandler } from '../ssr-handlers'
import { type UseStorageOptions, useStorage } from '../useStorage'
import { defaultWindow } from '../_configurable'
import { usePreferredDark } from '../usePreferredDark'

export type BasicColorMode = 'light' | 'dark'
export type BasicColorSchema = BasicColorMode | 'auto'

export interface UseColorModeOptions<T extends string = BasicColorSchema> extends UseStorageOptions<T | BasicColorSchema> {
  /**
   * CSS Selector for the target element applying to
   *
   * @default 'html'
   */
  selector?: string

  /**
   * HTML attribute applying the target element
   *
   * @default 'class'
   */
  attribute?: string

  /**
   * The initial color mode
   *
   * @default 'auto'
   */
  initialValue?: T | BasicColorSchema

  /**
   * Prefix when adding value to the attribute
   */
  modes?: Partial<Record<T | BasicColorSchema, string>>

  /**
   * A custom handler for handle the updates.
   * When specified, the default behavior will be overridded.
   *
   * @default undefined
   */
  onChanged?: (mode: T | BasicColorSchema, defaultHandler:((mode: T | BasicColorSchema) => void)) => void

  /**
   * Custom storage ref
   *
   * When provided, `useStorage` will be skipped
   */
  storageRef?: Ref<T | BasicColorSchema>

  /**
   * Key to persist the data into localStorage/sessionStorage.
   *
   * Pass `null` to disable persistence
   *
   * @default 'vueuse-color-scheme'
   */
  storageKey?: string | null

  /**
   * Storage object, can be localStorage or sessionStorage
   *
   * @default localStorage
   */
  storage?: StorageLike

  /**
   * Emit `auto` mode from state
   *
   * When set to `true`, preferred mode won't be translated into `light` or `dark`.
   * This is useful when the fact that `auto` mode was selected needs to be known.
   *
   * @default undefined
   */
  emitAuto?: boolean
}

export interface UseColorModeState<T extends string = BasicColorSchema> {
  setting: Ref<T | BasicColorSchema>
  currentMode: ComputedRef<T | BasicColorMode>
  isDark: ComputedRef<boolean>
}

export function useColorMode<T extends string = BasicColorSchema>(): WritableComputedRef<T | BasicColorSchema>
export function useColorMode<T extends string = BasicColorSchema>(options: UseColorModeOptions<T>, emit?: 'mode'): WritableComputedRef<T | BasicColorSchema>
export function useColorMode<T extends string = BasicColorSchema>(options: UseColorModeOptions<T>, emit: 'setting'): Ref<T | BasicColorSchema>
export function useColorMode<T extends string = BasicColorSchema>(options: UseColorModeOptions<T>, emit: 'state'): UseColorModeState<T>

/**
 * Reactive color mode with auto data persistence.
 *
 * @see https://vueuse.org/useColorMode
 * @param options
 */
export function useColorMode<T extends string = BasicColorSchema>(options: UseColorModeOptions<T> = {}, emit: 'mode' | 'setting' | 'state' = 'mode') {
  const {
    selector = 'html',
    attribute = 'class',
    initialValue = 'auto',
    window = defaultWindow,
    storage,
    storageKey = 'vueuse-color-scheme',
    listenToStorageChanges = true,
    storageRef,
    emitAuto,
  } = options

  const modes = {
    auto: '',
    light: 'light',
    dark: 'dark',
    ...options.modes || {},
  } as Record<BasicColorSchema | T, string>

  const preferredDark = usePreferredDark({ window })
  const preferredMode = computed(() => preferredDark.value ? 'dark' : 'light')

  const setting = storageRef || (storageKey == null
    ? ref(initialValue) as Ref<T | BasicColorSchema>
    : useStorage<T | BasicColorSchema>(storageKey, initialValue as BasicColorSchema, storage, { window, listenToStorageChanges }))

  const currentMode = computed<T | BasicColorMode>(() =>
    setting.value === 'auto' ? preferredMode.value : setting.value)

  const updateHTMLAttrs = getSSRHandler(
    'updateHTMLAttrs',
    (selector, attribute, value) => {
      const el = window?.document.querySelector(selector)
      if (!el)
        return

      if (attribute === 'class') {
        const current = value.split(/\s/g)
        Object.values(modes)
          .flatMap(i => (i || '').split(/\s/g))
          .filter(Boolean)
          .forEach((v) => {
            if (current.includes(v))
              el.classList.add(v)
            else
              el.classList.remove(v)
          })
      }
      else {
        el.setAttribute(attribute, value)
      }
    })

  function defaultOnChanged(mode: T | BasicColorSchema) {
    updateHTMLAttrs(selector, attribute, modes[mode] ?? mode)
  }

  function onChanged(mode: T | BasicColorSchema) {
    if (options.onChanged)
      options.onChanged(mode, defaultOnChanged)
    else
      defaultOnChanged(mode)
  }

  watch(currentMode, onChanged, { flush: 'post', immediate: true })

  tryOnMounted(() => onChanged(currentMode.value))

  switch (emit) {
    case 'setting':
      return setting
    case 'state':
      return { setting, currentMode, isDark: computed(() => currentMode.value === 'dark') }
    default:
      return computed<T | BasicColorSchema>({
        get() { return emitAuto ? setting.value : currentMode.value },
        set(v) { setting.value = v },
      })
  }
}
