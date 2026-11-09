import { useEffect, useRef } from 'react'

export function useFocusTrap<T extends HTMLElement>(open: boolean) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!open || !ref.current) {
      return
    }

    const focusable = ref.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    const previous = document.activeElement as HTMLElement | null
    first?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return
      }

      if (!focusable.length) {
        event.preventDefault()
        return
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previous?.focus()
    }
  }, [open])

  return ref
}
