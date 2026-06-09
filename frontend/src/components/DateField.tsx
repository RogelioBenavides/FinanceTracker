import DatePicker from 'react-datepicker'

/**
 * A date input that adapts to the device:
 *  - On iOS/iPadOS it renders a native <input type="date"> so users get the
 *    native iOS date wheel.
 *  - Everywhere else it renders the dark-themed react-datepicker.
 *
 * Works in local-time YYYY-MM-DD strings via the exported helpers so there are
 * no timezone off-by-one shifts.
 */

export function isoToDate(iso: string): Date | null {
  return iso ? new Date(iso + 'T00:00:00') : null
}

export function dateToIso(d: Date | null): string {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Detect iOS / iPadOS once. iPadOS 13+ masquerades as "MacIntel" but is touch.
const isIOS =
  typeof navigator !== 'undefined' &&
  (/iP(hone|od|ad)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

interface Props {
  selected: Date | null
  onChange: (d: Date | null) => void
  onBlur?: () => void
  minDate?: Date
  placeholderText?: string
  className?: string
  wrapperClassName?: string
  autoFocus?: boolean
  'aria-label'?: string
}

export default function DateField({
  selected,
  onChange,
  onBlur,
  minDate,
  placeholderText,
  className,
  wrapperClassName,
  autoFocus,
  'aria-label': ariaLabel,
}: Props) {
  if (isIOS) {
    return (
      <input
        type="date"
        value={dateToIso(selected)}
        min={minDate ? dateToIso(minDate) : undefined}
        onChange={(e) => onChange(e.target.value ? isoToDate(e.target.value) : null)}
        onBlur={onBlur}
        className={className}
        autoFocus={autoFocus}
        aria-label={ariaLabel ?? placeholderText}
      />
    )
  }

  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      onBlur={onBlur}
      minDate={minDate}
      placeholderText={placeholderText}
      dateFormat="yyyy-MM-dd"
      className={className}
      wrapperClassName={wrapperClassName}
      portalId="datepicker-portal"
      autoFocus={autoFocus}
      aria-label={ariaLabel}
    />
  )
}
