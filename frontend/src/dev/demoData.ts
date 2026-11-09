import type { EventRow, FindingRow, PermissionRow, RibbonMarker, ScorePoint } from '@/api/types'

export const demoPermissions: PermissionRow[] = [
  {
    resource: 'location_fine',
    state: 'granted',
    sensitivity_weight: 8,
    expected_for_category: true,
    last_used_ts: '2026-01-01T08:40:00Z',
    uses_24h: 14,
  },
  {
    resource: 'contacts',
    state: 'restricted',
    options: { foreground_only: true, max_per_tick: 5 },
    sensitivity_weight: 7,
    expected_for_category: false,
    last_used_ts: '2026-01-01T08:41:00Z',
    uses_24h: 3,
  },
  {
    resource: 'camera',
    state: 'denied',
    sensitivity_weight: 8,
    expected_for_category: true,
    last_used_ts: null,
    uses_24h: 0,
  },
]

export const demoEvents: EventRow[] = [
  {
    id: 'evt-1',
    app_id: 'app-flashlite',
    app_name: 'FlashLite',
    schema_version: '1.0',
    event_id: 'event-1',
    source: 'simulated',
    platform: 'sandbox',
    device_id: 'device-demo',
    app_key: 'flashlite',
    event_type: 'access',
    resource: 'contacts',
    action: 'read',
    timestamp: '2026-01-01T08:42:00Z',
    sim_tick: 5,
    context: 'background',
    purpose_code: 'analytics',
    outcome: 'blocked',
    count: 1,
    bytes_out: 0,
    destination: null,
    ts: '2026-01-01T08:42:00Z',
  },
  {
    id: 'evt-2',
    app_id: 'app-flashlite',
    app_name: 'FlashLite',
    schema_version: '1.0',
    event_id: 'event-2',
    source: 'real_device',
    platform: 'windows',
    device_id: 'device-demo',
    app_key: 'flashlite',
    event_type: 'network',
    resource: 'network',
    action: 'upload',
    timestamp: '2026-01-01T08:44:00Z',
    sim_tick: 6,
    context: 'background',
    purpose_code: 'analytics',
    outcome: 'limited',
    count: 1,
    bytes_out: 420000,
    destination: 'collector.ads-metrics.example',
    ts: '2026-01-01T08:44:00Z',
  },
]

export const demoFindings: FindingRow[] = [
  {
    id: 'finding-1',
    rule_id: 'R4',
    points: 10,
    severity: 'medium',
    message: 'Background access to contacts exceeded the expected rate.',
    baseline_mean: 0.1,
    z: 4.5,
    evidence_events: ['evt-1'],
  },
  {
    id: 'finding-2',
    rule_id: 'R6',
    points: 15,
    severity: 'high',
    message: 'Access-to-egress spike indicates outbound collection.',
    baseline_mean: 63000,
    z: 2.9,
    evidence_events: ['evt-2'],
  },
]

export const demoScorePoints: ScorePoint[] = [
  { sim_tick: 1, ts: '2026-01-01T08:10:00Z', score: 92, band: 'trusted', confidence: 'high', e: 8, g: 6, b: 10, d: 3, prev_score: 94, explanation: 'Baseline stable' },
  { sim_tick: 2, ts: '2026-01-01T08:20:00Z', score: 82, band: 'watch', confidence: 'medium', e: 10, g: 8, b: 14, d: 4, prev_score: 92, explanation: 'Permission drift and network spike' },
  { sim_tick: 3, ts: '2026-01-01T08:30:00Z', score: 58, band: 'suspicious', confidence: 'low', e: 12, g: 14, b: 28, d: 8, prev_score: 82, explanation: 'App behavior is drifting and sensitive access is unusual' },
]

export const demoRibbonMarkers: RibbonMarker[] = [
  { tick: 0, label: 'Start', tone: 'event' },
  { tick: 3, label: 'Alert', tone: 'alert' },
  { tick: 6, label: 'Action', tone: 'action' },
]
