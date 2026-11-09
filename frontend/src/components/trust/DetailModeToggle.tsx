import { useDetailMode } from '@/lib/detailMode'

export function DetailModeToggle() {
  const { mode, setMode } = useDetailMode()

  return (
    <div aria-label="Detail mode" className="inline-flex rounded-full border border-line bg-surface p-1">
      {(['simple', 'technical'] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={mode === option}
          aria-label={option === 'simple' ? 'Simple detail mode' : 'Technical detail mode'}
          onClick={() => setMode(option)}
          className={[
            'rounded-full px-3 py-2 text-sm transition-colors duration-150',
            mode === option ? 'bg-accent text-canvas' : 'text-muted',
          ].join(' ')}
        >
          {option === 'simple' ? 'Simple' : 'Technical'}
        </button>
      ))}
    </div>
  )
}
