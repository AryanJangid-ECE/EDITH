export type Resource =
  | 'location_fine'
  | 'location_background'
  | 'camera'
  | 'microphone'
  | 'contacts'
  | 'sms'
  | 'call_log'
  | 'photos'
  | 'storage'
  | 'calendar'
  | 'clipboard'
  | 'bluetooth'
  | 'sensors'
  | 'network'
  | 'notifications'

export type Context = 'foreground' | 'background' | 'unknown'
export type Outcome = 'allowed' | 'limited' | 'blocked'
export type EventSource = 'simulated' | 'real_device'
export type EventType = 'access' | 'permission_request' | 'permission_change' | 'network'
export type Band = 'trusted' | 'watch' | 'suspicious' | 'high_risk'
export type Confidence = 'low' | 'medium' | 'high'
export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type PermissionState = 'granted' | 'restricted' | 'denied'
export type Category = 'messaging' | 'navigation' | 'photo_editor' | 'utility_flashlight' | 'unknown'
export type AppStatus = 'active' | 'suspended'

export type EventRow = {
  id: string
  app_id: string
  app_name: string
  schema_version: string
  event_id: string
  source: EventSource
  platform: string
  device_id: string
  app_key: string
  event_type: EventType
  resource: Resource
  action: string
  timestamp: string
  sim_tick: number
  context: Context
  purpose_code: string | null
  outcome: Outcome
  count: number
  bytes_out: number
  destination: string | null
  ts: string
}

export type PermissionRow = {
  resource: Resource
  state: PermissionState
  options?: {
    foreground_only?: boolean
    max_per_tick?: number
  }
  granted_at?: string | null
  granted_tick?: number | null
  requested_by?: string | null
  sensitivity_weight: number
  expected_for_category: boolean
  last_used_ts?: string | null
  uses_24h: number
}

export type ScorePoint = {
  sim_tick: number
  ts: string
  score: number
  band: Band
  confidence: Confidence
  e: number
  g: number
  b: number
  d: number
  prev_score: number | null
  explanation: string
}

export type FindingRow = {
  id: string
  rule_id: string
  points: number
  severity: Severity
  message: string
  baseline_mean: number | null
  z: number | null
  evidence_events: string[]
}

export type RibbonMarker = {
  tick: number
  label: string
  tone?: 'event' | 'alert' | 'action'
}

export type DeviceCapabilities = {
  supports_revoke: boolean
  supports_restrict: boolean
  supports_suspend: boolean
}

export type PermissionAction = 'approve' | 'restrict' | 'revoke'

export type PermissionMatrixMode = 'app' | 'fleet'
