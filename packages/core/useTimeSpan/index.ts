import { type ComputedRef, computed } from 'vue-demi'
import { type MaybeComputedRef, resolveRef } from '@vueuse/shared'

const msSecond = 1000
const secMinute = 60
const minHour = 60
const hrDay = 24
const msMinute = msSecond * secMinute // 60,000
const msHour = msMinute * minHour // 3,600,000
const msDay = msHour * hrDay // 86,400,000

export interface TimeSpan {
  /**
   * Gets the value of the TimeSpan expressed in whole milliseconds.
   */
  totalMilliseconds: ComputedRef<number>
  /**
   * Gets the value of the TimeSpan expressed in whole and fractional seconds.
   */
  totalSeconds: ComputedRef<number>
  /**
   * Gets the value of the TimeSpan expressed in whole and fractional minutes.
   */
  totalMinutes: ComputedRef<number>
  /**
   * Gets the value of the TimeSpan expressed in whole and fractional hours.
   */
  totalHours: ComputedRef<number>
  /**
   * Gets the value of the TimeSpan expressed in whole and fractional days.
   */
  totalDays: ComputedRef<number>
  /**
   * Gets the milliseconds component of the time interval.
   */
  milliseconds: ComputedRef<number>
  /**
   * Gets the seconds component of the time interval.
   */
  seconds: ComputedRef<number>
  /**
   * Gets the minutes component of the time interval.
   */
  minutes: ComputedRef<number>
  /**
   * Gets the hours component of the time interval.
   */
  hours: ComputedRef<number>
  /**
   * Gets the days component of the time interval.
   */
  days: ComputedRef<number>
  /**
   * Get string representation of the TimeSpan value in the default format.
   */
  formatted: ComputedRef<string>
  /**
   * Set the default format that will be used in `formatted` property.
   *
   * @param format A format string.
   */
  setDefaultFormat(format: string): void
  /**
   * Converts the value of the TimeSpan object to its equivalent string representation by using the specified format.
   *
   * @param format A format string, when not defined, it will use the default format.
   */
  toString(format?: string): string
}

// This regex will generate 2 groups and only one is defined with literal
// It could generate one group for both case ('' & \) but unfortunately
// JS doesn't support Branch Reset Group (?|...) and Safari doesn't
// support Lookbehind (?<=...)
// Branch Reset exp => (?|'([^']+)'|\\(.))
// Lookbehind exp => ((?<=')[^']+(?=')|(?<=\\).)
const REGEX_LITERAL = /(?:'([^']+)'|\\(.))/
const REGEX_SYMBOLS = /[+-]|(?:d|D|H|M|S)+|(?:h|m|s){1,2}|f{1,3}/
const REGEX_FORMAT = new RegExp(`${REGEX_LITERAL.source}|${REGEX_SYMBOLS.source}`, 'g')
const REGEX_OPT_FORMAT = new RegExp(`\\[${REGEX_LITERAL.source}?(${REGEX_SYMBOLS.source})${REGEX_LITERAL.source}?]`, 'g')

function fprint(n: number, pad: number, opt: boolean, c = n) {
  return (!opt || c >= 1) ? String(n).padStart(pad, '0') : ''
}

function funit(num: number, total: number, pad: number, opt: boolean) {
  return fprint(Math.abs(num), pad, opt, Math.abs(total))
}

function ftunit(total: number, pad: number, opt: boolean) {
  return fprint(Math.trunc(Math.abs(total)), pad, opt)
}

const matches: Record<string, (ts: TimeSpan, pad: number, opt: boolean) => string> = {
  '+': ({ totalMilliseconds: ms }) => (ms.value >= 0) ? '+' : '-',
  '-': ({ totalMilliseconds: ms }) => (ms.value < 0) ? '-' : '',
  'd': (ts, pad, opt) => funit(ts.days.value, ts.totalDays.value, pad, opt),
  'D': (ts, pad, opt) => ftunit(ts.totalDays.value, pad, opt),
  'h': (ts, pad, opt) => funit(ts.hours.value, ts.totalHours.value, pad, opt),
  'H': (ts, pad, opt) => ftunit(ts.totalHours.value, pad, opt),
  'm': (ts, pad, opt) => funit(ts.minutes.value, ts.totalMinutes.value, pad, opt),
  'M': (ts, pad, opt) => ftunit(ts.totalMinutes.value, pad, opt),
  's': (ts, pad, opt) => funit(ts.seconds.value, ts.totalSeconds.value, pad, opt),
  'S': (ts, pad, opt) => ftunit(ts.totalSeconds.value, pad, opt),
  'f': (ts, pad, opt) => {
    const ms = String(Math.trunc(Math.abs(ts.milliseconds.value))).padStart(3, '0').slice(0, pad)
    return (!opt || !/^0+$/.test(ms)) ? ms : ''
  },
}

export const formatTimeSpan = (ts: TimeSpan, formatStr: string) => {
  return formatStr.replace(REGEX_OPT_FORMAT, (_, $1, $2, $3, $4, $5) => {
    const f = matches[$3[0]](ts, $3.length, true)
    return f ? `${$1 ?? $2 ?? ''}${f}${$4 ?? $5 ?? ''}` : ''
  }).replace(REGEX_FORMAT, (match, $1, $2) => $1 || $2 || matches[match[0]](ts, match.length, false))
}

const REGEX_SPARSE = /^([+-])?(?:(\d+(?:\.\d+)?)d)?(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?(?:(\d+(?:\.\d+)?)ms)?$/i
const REGEX_TPARSE = /^([+-])?(?:(?:(\d+)(?:\.|:))?(\d{1,2}):)?(\d{1,2}):(\d{1,2})(?:(?:\.|:)(\d+))?$/

const DEFAULT_FORMAT = '-[d\\.]hh:mm:ss[\\.fff]'

/**
 * Get reactive TimeSpan object that represents a time interval value in days, hours, minutes, seconds, and fractions of a second.
 *
 * @param milliseconds A time period expressed in milliseconds
 * @returns TimeSpan object
 */
export function useTimeSpan(milliseconds: MaybeComputedRef<number>): TimeSpan
/**
 * Get reactive TimeSpan object that represents a time interval value in days, hours, minutes, seconds, and fractions of a second.
 *
 * @param minutes Number of minutes.
 * @param seconds Number of seconds.
 * @returns TimeSpan object
 */
export function useTimeSpan(minutes: number, seconds: number): TimeSpan
/**
 * Get reactive TimeSpan object that represents a time interval value in days, hours, minutes, seconds, and fractions of a second.
 *
 * @param hours Number of hours.
 * @param minutes Number of minutes.
 * @param seconds Number of seconds.
 * @returns TimeSpan object
 */
export function useTimeSpan(hours: number, minutes: number, seconds: number): TimeSpan
/**
 * Get reactive TimeSpan object that represents a time interval value in days, hours, minutes, seconds, and fractions of a second.
 *
 * @param days Number of days.
 * @param hours Number of hours.
 * @param minutes Number of minutes.
 * @param seconds Number of seconds.
 * @returns TimeSpan object
 */
export function useTimeSpan(days: number, hours: number, minutes: number, seconds: number): TimeSpan
/**
 * Get reactive TimeSpan object that represents a time interval value in days, hours, minutes, seconds, and fractions of a second.
 *
 * @param days Number of days.
 * @param hours Number of hours.
 * @param minutes Number of minutes.
 * @param seconds Number of seconds.
 * @param milliseconds Number of milliseconds.
 * @returns TimeSpan object
 */
export function useTimeSpan(days: number, hours: number, minutes: number, seconds: number, milliseconds: number): TimeSpan
export function useTimeSpan(value: MaybeComputedRef<number>, ...args: number[]): TimeSpan {
  const ms = resolveRef((!args.length)
    ? value
    : (args.length === 1)
        ? ((value as number) * msMinute + args[0] * msSecond)
        : (args.length === 2)
            ? ((value as number) * msHour + args[0] * msMinute + args[1] * msSecond)
            : ((value as number) * msDay + args[0] * msHour + args[1] * msMinute + args[2] * msSecond + (args[3] ?? 0)))

  let defaultFormat = DEFAULT_FORMAT

  const ts: TimeSpan = {
    totalMilliseconds: ms,
    totalSeconds: computed(() => ms.value / msSecond),
    totalMinutes: computed(() => ms.value / msMinute),
    totalHours: computed(() => ms.value / msHour),
    totalDays: computed(() => ms.value / msDay),
    milliseconds: computed(() => ms.value % msSecond),
    seconds: computed(() => Math.trunc(ts.totalSeconds.value) % secMinute),
    minutes: computed(() => Math.trunc(ts.totalMinutes.value) % minHour),
    hours: computed(() => Math.trunc(ts.totalHours.value) % hrDay),
    days: computed(() => Math.trunc(ts.totalDays.value)),
    setDefaultFormat: f => defaultFormat = f,
    formatted: computed(() => ts.toString()),
    toString(format = defaultFormat) {
      return formatTimeSpan(ts, format)
    },
  }

  return ts
}

function fromNum(value: MaybeComputedRef<number>, scale: number) {
  const val = resolveRef(value)
  return useTimeSpan(() => val.value * scale)
}

/**
 * Get reactive TimeSpan object that represents a specified number of seconds.
 *
 * @param value A number of seconds
 * @returns TimeSpan object
 */
useTimeSpan.fromSeconds = (value: MaybeComputedRef<number>) => fromNum(value, msSecond)

/**
 * Get reactive TimeSpan object that represents a specified number of minutes.
 *
 * @param value A number of minutes
 * @returns TimeSpan object
 */
useTimeSpan.fromMinutes = (value: MaybeComputedRef<number>) => fromNum(value, msMinute)

/**
 * Get reactive TimeSpan object that represents a specified number of hours.
 *
 * @param value A number of hours
 * @returns TimeSpan object
 */
useTimeSpan.fromHours = (value: MaybeComputedRef<number>) => fromNum(value, msHour)

/**
 * Get reactive TimeSpan object that represents a specified number of days.
 *
 * @param value A number of days
 * @returns TimeSpan object
 */
useTimeSpan.fromDays = (value: MaybeComputedRef<number>) => fromNum(value, msDay)

/**
 * Converts a string representation of a time interval to its TimeSpan equivalent.
 *
 * @param str A string that specifies the time interval to convert.
 * @returns TimeSpan object
 */
useTimeSpan.parse = (str: string) => {
  const num = Number(str)
  if (Number.isNaN(num)) {
    const match = str.match(REGEX_SPARSE) ?? str.match(REGEX_TPARSE)
    if (match) {
      const sign = (match[1] === '-') ? -1 : 1
      return useTimeSpan(
        Number(match[2] ?? 0) * sign,
        Number(match[3] ?? 0) * sign,
        Number(match[4] ?? 0) * sign,
        Number(match[5] ?? 0) * sign,
        Number(match[6] ?? 0) * sign)
    }
  }

  return useTimeSpan(num)
}
