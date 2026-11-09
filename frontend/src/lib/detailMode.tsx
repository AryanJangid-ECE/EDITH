import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type DetailMode = 'simple' | 'technical'

type DetailModeContextValue = {
  mode: DetailMode
  setMode: (mode: DetailMode) => void
}

const DetailModeContext = createContext<DetailModeContextValue | undefined>(undefined)
const STORAGE_KEY = 'edith.detailMode'

function readStoredMode(): DetailMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'technical' ? 'technical' : 'simple'
  } catch {
    return 'simple'
  }
}

export function DetailModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<DetailMode>(() => readStoredMode())

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // no-op when storage is unavailable
    }
  }, [mode])

  const value = useMemo(
    () => ({
      mode,
      setMode: setModeState,
    }),
    [mode],
  )

  return <DetailModeContext.Provider value={value}>{children}</DetailModeContext.Provider>
}

export function useDetailMode() {
  const context = useContext(DetailModeContext)

  if (!context) {
    throw new Error('useDetailMode must be used within DetailModeProvider')
  }

  return context
}
