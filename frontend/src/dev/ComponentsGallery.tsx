import { useState } from 'react'

import { demoEvents, demoFindings, demoPermissions, demoRibbonMarkers, demoScorePoints } from './demoData'
import { PageSection } from '@/features/common/PageSection'
import { QueryBoundary } from '@/features/common/QueryBoundary'
import {
  BreakdownBars,
  ConfidenceBadge,
  EventTable,
  EvidenceDrawer,
  PermissionMatrix,
  ResourceChip,
  TrustGauge,
  TrustRibbon,
} from '@/components/trust'

export function ComponentsGallery() {
  const [canEdit, setCanEdit] = useState(true)
  const [supportsRevoke, setSupportsRevoke] = useState(true)
  const [supportsRestrict, setSupportsRestrict] = useState(true)
  const [mode, setMode] = useState<'simple' | 'technical'>('simple')
  const [boundaryState, setBoundaryState] = useState<'loading' | 'error' | 'empty' | 'data'>('data')
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Developer mode</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Trust components</h1>
      </header>

      <PageSection title="Trust gauge" description="Score and confidence state" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TrustGauge score={95} confidence="high" delta={5} size="sm" label="Trusted" />
          <TrustGauge score={62} confidence="medium" delta={-2} size="md" label="Watch" />
          <TrustGauge score={45} confidence="low" delta={-4} size="md" label="Suspicious" />
          <TrustGauge score={12} confidence="low" delta={-10} size="lg" label="High risk" />
        </div>
      </PageSection>

      <PageSection title="Breakdown bars" description="Technical and simple score breakdown">
        <div className="grid gap-4 xl:grid-cols-2">
          <BreakdownBars values={[{ label: 'Exposure', value: 12, cap: 20 }, { label: 'Unneeded access', value: 10, cap: 20 }, { label: 'Recent behaviour', value: 18, cap: 40 }, { label: 'New permissions', value: 6, cap: 10 }]} score={72} previousScore={82} />
          <BreakdownBars values={[{ label: 'E', value: 12, cap: 20 }, { label: 'G', value: 10, cap: 20 }, { label: 'B', value: 18, cap: 40 }, { label: 'D', value: 6, cap: 10 }]} score={72} previousScore={82} technical />
        </div>
      </PageSection>

      <PageSection title="Trust ribbon" description="Score markers and range highlights">
        <TrustRibbon data={demoScorePoints.map((point) => ({ tick: point.sim_tick, score: point.score, label: point.ts }))} markers={demoRibbonMarkers} empty={<span>No trend data.</span>} />
      </PageSection>

      <PageSection title="Permission matrix" description="Action menu and validation states">
        <div className="mb-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => setCanEdit((value) => !value)} className="rounded-card border border-line bg-canvas px-3 py-2 text-sm text-ink">{canEdit ? 'Can edit: on' : 'Can edit: off'}</button>
          <button type="button" onClick={() => setSupportsRestrict((value) => !value)} className="rounded-card border border-line bg-canvas px-3 py-2 text-sm text-ink">{supportsRestrict ? 'Restrict enabled' : 'Restrict disabled'}</button>
          <button type="button" onClick={() => setSupportsRevoke((value) => !value)} className="rounded-card border border-line bg-canvas px-3 py-2 text-sm text-ink">{supportsRevoke ? 'Revoke enabled' : 'Revoke disabled'}</button>
        </div>
        <PermissionMatrix rows={demoPermissions} canEdit={canEdit} capabilities={{ supports_revoke: supportsRevoke, supports_restrict: supportsRestrict, supports_suspend: true }} mode="fleet" appName="FlashLite" />
      </PageSection>

      <PageSection title="Events" description="Outcome, source badges and network formatting">
        <EventTable rows={demoEvents} />
      </PageSection>

      <PageSection title="Evidence drawer" description="Simple and technical evidence states">
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setDrawerOpen(true)} className="rounded-card bg-accent px-3 py-2 font-medium text-canvas">Open evidence</button>
          <button type="button" onClick={() => setMode((current) => (current === 'simple' ? 'technical' : 'simple'))} className="rounded-card border border-line bg-canvas px-3 py-2 text-ink">Toggle detail mode</button>
        </div>
        <EvidenceDrawer open={drawerOpen} findings={demoFindings} mode={mode} onClose={() => setDrawerOpen(false)} />
      </PageSection>

      <PageSection title="Query boundary" description="Loading, error, empty and data states">
        <div className="mb-4 flex gap-3">
          <button type="button" onClick={() => setBoundaryState('loading')} className="rounded-card border border-line bg-canvas px-3 py-2 text-ink">Loading</button>
          <button type="button" onClick={() => setBoundaryState('error')} className="rounded-card border border-line bg-canvas px-3 py-2 text-ink">Error</button>
          <button type="button" onClick={() => setBoundaryState('empty')} className="rounded-card border border-line bg-canvas px-3 py-2 text-ink">Empty</button>
          <button type="button" onClick={() => setBoundaryState('data')} className="rounded-card border border-line bg-canvas px-3 py-2 text-ink">Data</button>
        </div>
        <QueryBoundary
          isLoading={boundaryState === 'loading'}
          isError={boundaryState === 'error'}
          error={new Error('Request failed for demo state')}
          data={boundaryState === 'data' ? demoEvents : null}
          isEmpty={(value) => !value.length}
          onRetry={() => setBoundaryState('data')}
          empty={<span>No demo events.</span>}
        >
          {(data) => <EventTable rows={data} />}
        </QueryBoundary>
      </PageSection>

      <PageSection title="Trust atoms" description="Badges and chips for domain state">
        <div className="flex flex-wrap gap-3">
          <ConfidenceBadge value="low" />
          <ConfidenceBadge value="medium" />
          <ConfidenceBadge value="high" />
          <ResourceChip resource="camera" />
          <ResourceChip resource="network" />
        </div>
      </PageSection>
    </div>
  )
}
