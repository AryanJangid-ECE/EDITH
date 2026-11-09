import type {
  Band,
  Confidence,
  EventSource,
  Resource,
  Severity,
} from '@/api/types'

export type BandMeta = {
  label: string
  icon: string
  toneClass: string
  textClass: string
}

export const BAND_META: Record<Band, BandMeta> = {
  trusted: {
    label: 'Trusted',
    icon: '✓',
    toneClass: 'border-trusted/60 bg-trusted/10 text-trusted',
    textClass: 'text-trusted',
  },
  watch: {
    label: 'Watch',
    icon: '◌',
    toneClass: 'border-watch/60 bg-watch/10 text-watch',
    textClass: 'text-watch',
  },
  suspicious: {
    label: 'Suspicious',
    icon: '△',
    toneClass: 'border-suspicious/60 bg-suspicious/10 text-suspicious',
    textClass: 'text-suspicious',
  },
  high_risk: {
    label: 'High risk',
    icon: '✕',
    toneClass: 'border-risk/60 bg-risk/10 text-risk',
    textClass: 'text-risk',
  },
}

export const RULE_META: Record<string, { name: string; simple: string }> = {
  R1: { name: 'Frequency spike', simple: 'A resource spiked above the expected rate in the recent window.' },
  R2: { name: 'New resource use', simple: 'The app started using a resource it had not used before.' },
  R3: { name: 'Permission escalation', simple: 'The app requested new sensitive permissions.' },
  R4: { name: 'Background sensitive access', simple: 'The app accessed a sensitive resource while backgrounded.' },
  R5: { name: 'Persistent blocked attempts', simple: 'Blocked access attempts kept repeating.' },
  R6: { name: 'Access-to-egress correlation', simple: 'A sensitive resource spike coincided with unusually large outbound traffic.' },
  R7: { name: 'Purpose mismatch', simple: 'The app used a sensitive resource for an unexpected purpose.' },
}

export const RESOURCE_META: Record<Resource, { label: string; icon: string }> = {
  location_fine: { label: 'Precise location', icon: '📍' },
  location_background: { label: 'Background location', icon: '🧭' },
  camera: { label: 'Camera', icon: '📷' },
  microphone: { label: 'Microphone', icon: '🎙️' },
  contacts: { label: 'Contacts', icon: '👥' },
  sms: { label: 'SMS', icon: '💬' },
  call_log: { label: 'Call log', icon: '📞' },
  photos: { label: 'Photos', icon: '🖼️' },
  storage: { label: 'Storage', icon: '📁' },
  calendar: { label: 'Calendar', icon: '📅' },
  clipboard: { label: 'Clipboard', icon: '📋' },
  bluetooth: { label: 'Bluetooth', icon: '🟦' },
  sensors: { label: 'Sensors', icon: '📡' },
  network: { label: 'Network', icon: '🌐' },
  notifications: { label: 'Notifications', icon: '🔔' },
}

export function clampScore(score?: number | null): number {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 0
  }

  return Math.min(100, Math.max(0, score))
}

export function bandFor(score?: number | null): Band {
  const value = clampScore(score)

  if (value >= 80) return 'trusted'
  if (value >= 60) return 'watch'
  if (value >= 40) return 'suspicious'
  return 'high_risk'
}

export function confidenceLabel(value?: Confidence | number | null): Confidence {
  if (value === 'low' || value === 'medium' || value === 'high') {
    return value
  }

  if (typeof value === 'number') {
    if (value < 0.5) return 'low'
    if (value < 1) return 'medium'
    return 'high'
  }

  return 'medium'
}

export function sensitivityLevel(weight: number): 'normal' | 'sensitive' | 'special' {
  if (weight >= 8) return 'special'
  if (weight >= 4) return 'sensitive'
  return 'normal'
}

export function tickToSimTime(tick: number): Date {
  const base = Date.UTC(2026, 0, 1, 8, 0, 0)
  return new Date(base + Math.max(0, tick) * 10 * 60 * 1000)
}

export function formatSimTime(tick: number): string {
  const date = tickToSimTime(tick)
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    hour12: false,
  })

  return formatter.format(date).replace(' at ', ', ')
}

export function formatBytes(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0

  if (safe < 1024) return `${safe} B`
  if (safe < 1024 * 1024) return `${(safe / 1024).toFixed(safe >= 10_240 ? 1 : 2)} KB`
  return `${(safe / (1024 * 1024)).toFixed(1)} MB`
}

export function getSourceTone(source: EventSource): string {
  return source === 'simulated' ? 'border-[#9B8CFF]/60 bg-[#9B8CFF]/10 text-[#D9D2FF]' : 'border-[#3DDC97]/60 bg-[#3DDC97]/10 text-[#D9FDEB]'
}

export function getSeverityMeta(level: Severity): { label: string; icon: string; toneClass: string } {
  const map: Record<Severity, { label: string; icon: string; toneClass: string }> = {
    low: { label: 'Low', icon: '△', toneClass: 'border-watch/60 bg-watch/10 text-watch' },
    medium: { label: 'Medium', icon: '◉', toneClass: 'border-suspicious/60 bg-suspicious/10 text-suspicious' },
    high: { label: 'High', icon: '▲', toneClass: 'border-risk/60 bg-risk/10 text-risk' },
    critical: { label: 'Critical', icon: '✕', toneClass: 'border-risk/60 bg-risk/10 text-risk' },
  }

  return map[level]
}

export function createRibbonData(entries: Array<{ tick: number; score: number; label: string }>) {
  return [...entries]
    .sort((a, b) => a.tick - b.tick)
    .map((entry) => ({
      tick: entry.tick,
      label: entry.label,
      score: clampScore(entry.score),
    }))
}
