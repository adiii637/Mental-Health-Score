import { useState, useEffect, useCallback } from 'react'
import {
  Activity,
  BarChart3,
  BookOpen,
  Calendar,
  RefreshCw,
  AlertCircle,
  Plus,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Container from '../components/Container'
import Button from '../components/Button'
import OverviewCard from '../components/OverviewCard'
import ScoreTrendChart from '../components/ScoreTrendChart'
import WellnessInsights from '../components/WellnessInsights'
import RecentAssessments from '../components/RecentAssessments'
import QuickActions from '../components/QuickActions'
import ScoreGauge from '../components/ScoreGauge'
import { getDashboardSummary } from '../api/dashboard'
import { useAuth } from '../hooks/useAuth'

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const summary = await getDashboardSummary()
      setData(summary)
    } catch (err) {
      setError(err?.message || 'Failed to load dashboard metrics. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const firstName = user?.name ? user.name.split(' ')[0] : 'Student'
  const latestScore = data?.latest_score
  const latestCategory = data?.latest_category
  const previousScore = data?.previous_score
  const scoreDiff = data?.score_difference
  const totalAssessments = data?.total_assessments ?? 0
  const totalJournals = data?.total_journals ?? 0

  const categoryVariant =
    latestCategory === 'Strong'
      ? 'sage'
      : latestCategory === 'Balanced'
      ? 'amber'
      : 'coral'

  return (
    <div className="flex flex-col min-h-screen page-enter">
      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <Container>
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="eyebrow mb-1.5">Personal Analytics</span>
              <h1 className="font-display font-medium text-pine-deep text-3xl sm:text-4xl">
                Welcome back, {firstName}
              </h1>
              <p className="text-ink-soft text-xs sm:text-sm mt-1">
                Here is your authenticated wellness overview and latest model predictions.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={loadDashboard}
                disabled={loading}
                className="p-2.5 rounded-xl border border-paper-deep bg-white/70 text-ink-soft hover:text-pine hover:bg-white transition-all disabled:opacity-50"
                title="Refresh dashboard"
                aria-label="Refresh dashboard data"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <Button variant="primary" size="md" to="/assessment" className="gap-2">
                <Plus size={16} /> New Assessment
              </Button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-coral/10 border border-coral/25 flex items-center gap-3 text-coral text-sm">
              <AlertCircle size={18} className="flex-shrink-0" />
              <p className="flex-1">{error}</p>
              <button
                type="button"
                onClick={loadDashboard}
                className="font-medium underline hover:text-coral-dark"
              >
                Retry
              </button>
            </div>
          )}

          {/* Key Metrics Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Latest Score Card */}
            <OverviewCard
              title="Latest Wellness Score"
              value={
                latestScore !== null && latestScore !== undefined
                  ? Number(latestScore).toFixed(2)
                  : '—'
              }
              subtitle="Calculated on 0–10 scale"
              badge={latestCategory || 'No Data'}
              badgeVariant={categoryVariant}
              diff={scoreDiff}
              loading={loading}
              icon={Activity}
            >
              {latestScore !== null && latestScore !== undefined && (
                <div className="flex justify-center py-2">
                  <ScoreGauge score={latestScore} size="sm" animated />
                </div>
              )}
            </OverviewCard>

            {/* Previous Score */}
            <OverviewCard
              title="Previous Assessment"
              value={
                previousScore !== null && previousScore !== undefined
                  ? Number(previousScore).toFixed(2)
                  : '—'
              }
              subtitle={
                previousScore !== null
                  ? 'Score from prior assessment'
                  : 'No prior assessment on record'
              }
              loading={loading}
              icon={Calendar}
            />

            {/* Total Assessments */}
            <OverviewCard
              title="Assessments Taken"
              value={loading ? '—' : totalAssessments}
              subtitle="Total model evaluations"
              badge={totalAssessments > 0 ? 'Active' : 'Get Started'}
              badgeVariant="pine"
              loading={loading}
              icon={BarChart3}
            />

            {/* Journal Entries */}
            <OverviewCard
              title="Journal Reflections"
              value={loading ? '—' : totalJournals}
              subtitle="Private entries logged"
              badge={totalJournals > 0 ? 'Private' : 'New'}
              badgeVariant="amber"
              loading={loading}
              icon={BookOpen}
            />
          </div>

          {/* Score Trend Chart (Recharts) */}
          <div className="mb-8">
            <ScoreTrendChart trend={data?.trend || []} loading={loading} />
          </div>

          {/* Wellness Insights (Observations based on recorded features) */}
          <div className="mb-8">
            <WellnessInsights
              insights={data?.insights || []}
              loading={loading}
            />
          </div>

          {/* Recent Assessments & Quick Actions side-by-side on larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <RecentAssessments
                assessments={data?.recent_assessments || []}
                loading={loading}
              />
            </div>

            <div className="lg:col-span-1">
              <QuickActions />
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  )
}
