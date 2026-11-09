import {
  BrowserRouter,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import { AppProviders } from './app/providers'
import {
  BandBadge,
  BreakdownBars,
  ConfidenceBadge,
  DetailModeToggle,
  EventTable,
  EvidenceDrawer,
  PermissionMatrix,
  SourceBadge,
  TrustGauge,
  TrustRibbon,
} from './components/trust'
import { Badge } from './components/ui/Badge'
import { ChatbotWidget } from './components/ui/ChatbotWidget'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { ComponentsGallery } from './dev/ComponentsGallery'
import { PageSection } from './features/common/PageSection'
import { PendingSection } from './features/common/PendingSection'
import { cn } from './lib/cn'
import { demoEvents, demoFindings, demoPermissions, demoScorePoints } from './dev/demoData'

type NavItem = {
  label: string
  to: string
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Apps', to: '/apps' },
  { label: 'Monitor', to: '/monitor' },
  { label: 'Alerts', to: '/alerts' },
  { label: 'Recommendations', to: '/recommendations' },
  { label: 'History', to: '/history' },
  { label: 'Lab', to: '/lab' },
  { label: 'Settings', to: '/settings' },
]

const MOBILE_ITEMS = [{ label: 'Home', to: '/' }, ...NAV_ITEMS]

function App() {
  return (
    <AppProviders>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/apps" element={<AppsPage />} />
              <Route path="/apps/:id" element={<AppDetailPage />} />
              <Route path="/monitor" element={<MonitorPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/recommendations" element={<RecommendationsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/lab" element={<LabPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/dev/components" element={<ComponentsGallery />} />
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </AppProviders>
  )
}

function AppLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-line bg-surface/90 xl:flex xl:flex-col xl:p-6">
          <div className="flex items-center gap-3 border-b border-line pb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-card bg-accent/15 font-mono text-base font-semibold text-accent">
              E
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Sandbox</p>
              <h1 className="text-lg font-semibold text-ink">E.D.I.T.H.</h1>
            </div>
          </div>

          <nav className="mt-6 flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-card border px-3 py-2 text-sm transition-colors duration-150',
                    isActive ? 'border-accent/40 bg-accent/10 text-ink' : 'border-transparent bg-transparent text-muted hover:border-line hover:bg-raised hover:text-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-4 rounded-card border border-line bg-canvas p-4">
            <Badge tone="simulated">SIMULATED DEVICE</Badge>
            <p className="text-sm text-muted">Demo data is synthetic and never claims live monitoring.</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
              <div className="flex items-center gap-3 xl:hidden">
                <div className="flex h-9 w-9 items-center justify-center rounded-card bg-accent/15 font-mono text-sm font-semibold text-accent">E</div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted">EDITH</p>
                  <p className="text-sm font-medium text-ink">Permission monitor</p>
                </div>
              </div>

              <div className="hidden items-center gap-2 xl:flex">
                <Badge tone="simulated">SIMULATED DEVICE</Badge>
                <Badge tone="real">REAL DEVICE</Badge>
              </div>

              <div className="flex items-center gap-3">
                <DetailModeToggle />
                <NavLink to="/login" className={({ isActive }) => cn('rounded-card border px-3 py-2 text-sm font-medium transition-colors duration-150', isActive ? 'border-accent/50 bg-accent/10 text-ink' : 'border-line bg-surface text-muted')}>Login</NavLink>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>

          <ChatbotWidget />

          <nav className="border-t border-line bg-surface/90 px-2 py-2 xl:hidden">
            <div className="grid grid-cols-5 gap-2">
              {MOBILE_ITEMS.map((item) => {
                const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
                return (
                  <NavLink key={item.to} to={item.to} className={cn('rounded-card px-2 py-2 text-center text-[10px] font-medium transition-colors duration-150', isActive ? 'bg-accent/10 text-ink' : 'text-muted')}>
                    {item.label}
                  </NavLink>
                )
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
}

function LandingPage() {
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Permission intelligence</p>
        <h1 className="mt-4 text-4xl font-semibold text-ink md:text-5xl">Trust the access layer, not the app at install time.</h1>
      </header>
      <div className="rounded-card border border-line bg-surface p-6 md:p-8">
        <p className="max-w-2xl text-base text-muted">E.D.I.T.H. watches permission use patterns, highlights drift, and explains why an app may deserve a change in trust.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <NavLink to="/dashboard" className="rounded-card bg-accent px-4 py-2 font-medium text-canvas">Open command center</NavLink>
          <NavLink to="/monitor" className="rounded-card border border-line bg-canvas px-4 py-2 font-medium text-ink">Live monitor</NavLink>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Trust score" body="Estimated trust indicator based on observed permissions and behaviour. Not a guarantee of safety." />
        <InfoCard title="Alerts" body="Behavioural drift, background access, and permission escalation are grouped into explainable incidents." />
        <InfoCard title="Controls" body="Apply safe, reversible actions inside the sandbox before a real decision is made." />
      </div>
    </section>
  )
}

function LoginPage() {
  return (
    <section className="mx-auto max-w-lg rounded-card border border-line bg-surface p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-accent">Access</p>
      <h1 className="mt-3 text-2xl font-semibold text-ink">Secure workspace</h1>
      <div className="mt-6 space-y-4">
        <label className="block text-sm text-muted">
          Email
          <input className="mt-2 w-full rounded-card border border-line bg-canvas px-3 py-2 text-ink outline-none" defaultValue="owner@edith.local" />
        </label>
        <label className="block text-sm text-muted">
          Password
          <input type="password" className="mt-2 w-full rounded-card border border-line bg-canvas px-3 py-2 text-ink outline-none" defaultValue="ChangeMe123!" />
        </label>
        <button type="button" className="w-full rounded-card bg-accent px-4 py-2.5 font-medium text-canvas">Continue to dashboard</button>
      </div>
    </section>
  )
}

function DashboardPage() {
  return (
    <section className="space-y-6">
      <HeaderRow title="Command center" subtitle="Overview of app trust, permissions and live risk" />
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12">
        <PageSection title="Fleet trust summary" className="col-span-full min-w-0">
          <div className="flex flex-wrap gap-4">
            <BandBadge score={91} />
            <SourceBadge source="simulated" />
            <ConfidenceBadge value="high" />
          </div>
        </PageSection>
        <div className="col-span-full min-w-0">
          <PendingSection title="App trust" phase={9}>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              <TrustGauge score={93} confidence="high" delta={2} label="ChatterBox" />
              <TrustGauge score={86} confidence="medium" delta={-6} label="RouteRunner" />
              <TrustGauge score={74} confidence="medium" delta={-8} label="PixelPal" />
              <TrustGauge score={39} confidence="low" delta={-18} label="FlashLite" />
            </div>
          </PendingSection>
        </div>
        <div className="min-w-0 xl:col-span-4 2xl:col-span-3">
          <PendingSection title="Open incidents" phase={10}>
            <div className="space-y-3 text-sm text-muted">FlashLite detected unusual background access and permission drift.</div>
          </PendingSection>
        </div>
        <div className="min-w-0 xl:col-span-4 2xl:col-span-3">
          <PendingSection title="Top recommendations" phase={10}>
            <div className="space-y-3 text-sm text-muted">Suspend FlashLite, revoke contacts, restrict background location.</div>
          </PendingSection>
        </div>
        <div className="min-w-0 xl:col-span-4 2xl:col-span-3">
          <PendingSection title="Activity KPIs" phase={9}>
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              <MetricCard label="Events / tick" value="18" tone="neutral" />
              <MetricCard label="Blocked" value="6" tone="warn" />
              <MetricCard label="Sensitive" value="8" tone="risk" />
            </div>
          </PendingSection>
        </div>
        <div className="min-w-0 xl:col-span-4 2xl:col-span-3">
          <PendingSection title="Live ticker" phase={10}>
            <div className="text-sm text-muted">Background access from FlashLite is the current primary watch item.</div>
          </PendingSection>
        </div>
      </div>
    </section>
  )
}

function AppsPage() {
  const apps = ['ChatterBox', 'RouteRunner', 'PixelPal', 'FlashLite']

  return (
    <section className="space-y-6">
      <HeaderRow title="Applications" subtitle="Permission profiles and trust posture" />
      <PendingSection title="Applications" phase={9}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {apps.map((app, index) => (
            <div key={app} className="rounded-card border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-ink">{app}</h2>
                <BandBadge score={index === 3 ? 40 : 90} />
              </div>
              <p className="mt-3 text-sm text-muted">{app === 'FlashLite' ? '4 recent permission requests detected' : 'Normal behavior across granted resources'}</p>
              <NavLink to={`/apps/${app.toLowerCase()}`} className="mt-4 inline-flex rounded-card border border-line bg-canvas px-3 py-2 text-sm text-ink">View app</NavLink>
            </div>
          ))}
        </div>
      </PendingSection>
    </section>
  )
}

function AppDetailPage() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? 'overview'
  const validTabs = ['overview', 'permissions', 'activity', 'trust', 'recommendations'] as const
  const resolvedTab = validTabs.includes(tab as never) ? (tab as (typeof validTabs)[number]) : 'overview'

  return (
    <section className="space-y-6">
      <HeaderRow title={id ? id : 'App detail'} subtitle={`Route: ${id ?? 'unknown'} • Permission detail and trust context`} />
      <div className="rounded-card border border-line bg-surface p-2">
        <div className="flex flex-wrap gap-2">
          {validTabs.map((item) => (
            <button key={item} type="button" onClick={() => setSearchParams({ tab: item })} className={cn('rounded-card px-3 py-2 text-sm capitalize transition-colors duration-150', resolvedTab === item ? 'bg-accent text-canvas' : 'text-muted')}>
              {item}
            </button>
          ))}
        </div>
      </div>

      {resolvedTab === 'overview' ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_1.9fr]">
          <PendingSection title="Header region" phase={9}>
            <TrustGauge score={72} confidence="medium" delta={-6} label="FlashLite" />
          </PendingSection>
          <PendingSection title="Trust ribbon + breakdown + findings" phase={9}>
            <div className="space-y-4">
              <TrustRibbon data={demoScorePoints.map((point) => ({ tick: point.sim_tick, score: point.score, label: point.ts }))} markers={[{ tick: 2, label: 'Alert', tone: 'alert' }]} />
              <BreakdownBars values={[{ label: 'Exposure', value: 12, cap: 20 }, { label: 'Unneeded access', value: 10, cap: 20 }, { label: 'Recent behaviour', value: 18, cap: 40 }, { label: 'New permissions', value: 6, cap: 10 }]} score={72} previousScore={82} technical />
            </div>
          </PendingSection>
        </div>
      ) : null}

      {resolvedTab === 'permissions' ? (
        <PendingSection title="Permissions" phase={9}>
          <PermissionMatrix rows={demoPermissions} canEdit mode="app" appName={id ?? 'FlashLite'} onAction={() => undefined} capabilities={{ supports_revoke: true, supports_restrict: true, supports_suspend: true }} />
        </PendingSection>
      ) : null}

      {resolvedTab === 'activity' ? (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <PendingSection title="Timeline" phase={9}>
            <div className="rounded-card border border-line bg-canvas p-4 text-sm text-muted">Event timeline placeholder for app-scoped activity.</div>
          </PendingSection>
          <PendingSection title="Events" phase={9}>
            <EventTable rows={demoEvents} />
          </PendingSection>
        </div>
      ) : null}

      {resolvedTab === 'trust' ? (
        <PendingSection title="Score analysis" phase={9}>
          <div className="space-y-3 text-sm text-muted">Estimated trust indicator based on observed permissions and behaviour. Not a guarantee of safety.</div>
        </PendingSection>
      ) : null}

      {resolvedTab === 'recommendations' ? (
        <PendingSection title="Recommendations list" phase={9}>
          <div className="space-y-3 text-sm text-muted">Suspend FlashLite, revoke contacts, restrict background location.</div>
        </PendingSection>
      ) : null}
    </section>
  )
}

function MonitorPage() {
  return (
    <section className="space-y-6">
      <HeaderRow title="Monitor" subtitle="Event stream and policy decisions" />
      <PendingSection title="Event stream" phase={10}>
        <EventTable rows={demoEvents} />
      </PendingSection>
    </section>
  )
}

function AlertsPage() {
  return (
    <section className="space-y-6">
      <HeaderRow title="Alerts" subtitle="Explainable findings and incident grouping" />
      <div className="grid gap-4 xl:grid-cols-2">
        <PendingSection title="Incident list" phase={10}>
          <div className="space-y-3">
            <AlertRow title="FlashLite requested 4 unrelated permissions" tone="risk" />
            <AlertRow title="Background access to contacts exceeded the expected range" tone="warn" />
          </div>
        </PendingSection>
        <PendingSection title="Details" phase={10}>
          <EvidenceDrawer open findings={demoFindings} mode="simple" onClose={() => undefined} />
          <div className="text-sm text-muted">Drawer detail region for selected findings.</div>
        </PendingSection>
      </div>
    </section>
  )
}

function RecommendationsPage() {
  return (
    <section className="space-y-6">
      <HeaderRow title="Recommendations" subtitle="Reversible actions with estimated impact" />
      <PendingSection title="Recommendations" phase={10}>
        <div className="space-y-4">
          <RecommendationRow title="Suspend FlashLite" description="Stop sensitive network and permission access until the app is reviewed." />
          <RecommendationRow title="Revoke contacts permissions" description="Prevent contact access until permission necessity is confirmed." />
        </div>
      </PendingSection>
    </section>
  )
}

function HistoryPage() {
  const [tab, setTab] = useSearchParams()
  const active = tab.get('tab') === 'audit' ? 'audit' : 'events'

  return (
    <section className="space-y-6">
      <HeaderRow title="History" subtitle="Access timeline and permission drift" />
      <div className="rounded-card border border-line bg-surface p-2">
        <div className="flex gap-2">
          {['events', 'audit'].map((item) => (
            <button key={item} type="button" onClick={() => setTab({ tab: item })} className={cn('rounded-card px-3 py-2 text-sm capitalize', active === item ? 'bg-accent text-canvas' : 'text-muted')}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <PendingSection title={active === 'events' ? 'Events' : 'Audit log'} phase={10}>
        <div className="text-sm text-muted">{active === 'events' ? 'Historical event stream.' : 'User-triggered actions and audit trail.'}</div>
      </PendingSection>
    </section>
  )
}

function LabPage() {
  return (
    <section className="space-y-6">
      <HeaderRow title="Lab" subtitle="Scenario controls and what-if analysis" />
      <PendingSection title="Scenario controls" phase={10}>
        <div className="text-sm text-muted">Scenario controls and what-if simulation inputs will live here in a later phase.</div>
      </PendingSection>
    </section>
  )
}

function SettingsPage() {
  return (
    <section className="space-y-6">
      <HeaderRow title="Settings" subtitle="Privacy and device policy" />
      <div className="space-y-4">
        <PendingSection title="Preferences" phase={10}>
          <div className="space-y-4 rounded-card border border-line bg-canvas p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink">Detail mode</p>
                <p className="text-xs text-muted">Choose the level of technical detail shown in the interface.</p>
              </div>
              <DetailModeToggle />
            </div>
          </div>
        </PendingSection>
        <PendingSection title="Policy preferences" phase={10}>
          <div className="space-y-3 text-sm text-muted">
            <div className="flex items-center justify-between"><span>Auto-grant permission requests</span><Badge tone="success">On</Badge></div>
            <div className="flex items-center justify-between"><span>Demo mode</span><Badge tone="simulated">Synthetic</Badge></div>
          </div>
        </PendingSection>
      </div>
    </section>
  )
}

function NotFoundPage() {
  return (
    <section className="mx-auto max-w-lg rounded-card border border-line bg-surface p-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-accent">404</p>
      <h1 className="mt-3 text-2xl font-semibold text-ink">Route unavailable</h1>
      <p className="mt-3 text-sm text-muted">This route is not part of the current app shell.</p>
      <NavLink to="/dashboard" className="mt-5 inline-flex rounded-card bg-accent px-4 py-2 font-medium text-canvas">Return to dashboard</NavLink>
    </section>
  )
}

function HeaderRow({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header>
      <p className="text-xs uppercase tracking-[0.3em] text-accent">E.D.I.T.H.</p>
      <h1 className="mt-2 text-3xl font-semibold text-ink">{title}</h1>
      <p className="mt-2 text-sm text-muted">{subtitle}</p>
    </header>
  )
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-card border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-accent">{title}</p>
      <p className="mt-3 text-sm text-muted">{body}</p>
    </article>
  )
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: 'success' | 'warn' | 'neutral' | 'risk' }) {
  const toneClasses = {
    success: 'border-trusted/30 bg-trusted/10 text-trusted',
    warn: 'border-watch/30 bg-watch/10 text-watch',
    neutral: 'border-line bg-canvas text-ink',
    risk: 'border-risk/30 bg-risk/10 text-risk',
  }

  return (
    <div className={cn('rounded-card border p-5', toneClasses[tone])}>
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-ink">{value}</p>
    </div>
  )
}

function AlertRow({ title, tone }: { title: string; tone: 'warn' | 'risk' }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-card border border-line bg-surface p-4">
      <div>
        <p className="text-base font-medium text-ink">{title}</p>
      </div>
      <Badge tone={tone === 'risk' ? 'risk' : 'warn'}>{tone === 'risk' ? 'High risk' : 'Watch'}</Badge>
    </div>
  )
}

function RecommendationRow({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-medium text-ink">{title}</p>
        <Badge tone="success">Recommended</Badge>
      </div>
      <p className="mt-3 text-sm text-muted">{description}</p>
    </div>
  )
}

export default App
