import { describe, expect, it } from 'vitest'

import {
  BAND_META,
  RESOURCE_META,
  RULE_META,
  bandFor,
  confidenceLabel,
  createRibbonData,
  formatBytes,
  formatSimTime,
  sensitivityLevel,
  tickToSimTime,
} from './trust'

describe('trust helpers', () => {
  it('returns the correct band boundaries', () => {
    expect(bandFor(0)).toBe('high_risk')
    expect(bandFor(39)).toBe('high_risk')
    expect(bandFor(40)).toBe('suspicious')
    expect(bandFor(59)).toBe('suspicious')
    expect(bandFor(60)).toBe('watch')
    expect(bandFor(79)).toBe('watch')
    expect(bandFor(80)).toBe('trusted')
    expect(bandFor(100)).toBe('trusted')
    expect(bandFor(120)).toBe('trusted')
    expect(bandFor(-5)).toBe('high_risk')
  })

  it('formats confidence values', () => {
    expect(confidenceLabel('low')).toBe('low')
    expect(confidenceLabel(0.4)).toBe('low')
    expect(confidenceLabel(0.7)).toBe('medium')
    expect(confidenceLabel(1)).toBe('high')
  })

  it('maps sensitivity levels', () => {
    expect(sensitivityLevel(3)).toBe('normal')
    expect(sensitivityLevel(4)).toBe('sensitive')
    expect(sensitivityLevel(7)).toBe('sensitive')
    expect(sensitivityLevel(8)).toBe('special')
  })

  it('computes tick time deterministically', () => {
    expect(tickToSimTime(0).toISOString()).toBe('2026-01-01T08:00:00.000Z')
    expect(tickToSimTime(6).toISOString()).toBe('2026-01-01T09:00:00.000Z')
    expect(tickToSimTime(144).toISOString()).toBe('2026-01-02T08:00:00.000Z')
    expect(formatSimTime(0)).toBe('Jan 1, 08:00')
  })

  it('formats byte counts', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1600)).toBe('1.56 KB')
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
  })

  it('covers all resource and rule metadata', () => {
    expect(Object.keys(RESOURCE_META)).toHaveLength(15)
    expect(Object.keys(RULE_META)).toHaveLength(7)
    expect(BAND_META.trusted.label).toBe('Trusted')
  })

  it('builds ribbon data sorted by tick', () => {
    expect(
      createRibbonData([
        { tick: 2, score: 20, label: 'b' },
        { tick: 1, score: 50, label: 'a' },
        { tick: 1, score: 60, label: 'a-dup' },
      ]),
    ).toEqual([
      { tick: 1, label: 'a', score: 50 },
      { tick: 1, label: 'a-dup', score: 60 },
      { tick: 2, label: 'b', score: 20 },
    ])
  })
})
