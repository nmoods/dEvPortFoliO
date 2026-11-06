import { useCallback, useState } from 'react'

// Lets every component work both controlled (`value` + `onChange`) and uncontrolled (`defaultValue`).
export function useControllableState({ value, defaultValue, onChange }) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const setValue = useCallback(
    (nextValue) => {
      if (Object.is(nextValue, currentValue)) return
      if (!isControlled) setInternalValue(nextValue)
      onChange?.(nextValue)
    },
    [currentValue, isControlled, onChange]
  )

  return [currentValue, setValue]
}
