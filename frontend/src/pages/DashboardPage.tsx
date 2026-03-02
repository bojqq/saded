import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LineChart, Line, CartesianGrid,
} from 'recharts'
import { useDashboard } from '@/hooks/useDashboard'
import {
  Loader2, RefreshCw, FileText, TrendingUp, AlertCircle,
  CheckCircle, Activity, BarChart2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

function SeverityDot({ severity }: { severity: string }) {
  return (
    <span className={cn('inline-block w-2 h-2 rounded-full shrink-0', {
      'bg-green-500':  severity === 'GREEN',
      'bg-amber-400':  severity === 'YELLOW',
      'bg-red-500':    severity === 'RED',
    })} />
  )
}

function KpiCard({
  label, value, sub, icon: Icon, valueClass = 'text-green-900',
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  valueClass?: string
}) {
  return (
    <Card className="bg-white border-green-200 rounded-md shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs text-green-600">{label}</span>
          <Icon size={14} className="text-green-300 mt-0.5" />
        </div>
        <p className={cn('text-2xl font-bold tabular-nums tracking-tight', valueClass)}>{value}</p>
        {sub && <p className="text-xs text-green-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

const tooltipStyle = {
  fontSize: 11,
  border: '1px solid #bbf7d0',
  borderRadius: 6,
  backgroundColor: '#ffffff',
  color: '#14532d',
}

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { data, isLoading, error, refetch } = useDashboard()
  const isAr = i18n.language === 'ar'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-green-400" size={24} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50 shadow-none rounded-md">
          <CardContent className="p-4 text-red-600 text-sm">
            {t('dashboard.error')}
          </CardContent>
        </Card>
      </div>
    )
  }

  const {
    total_submissions, severity_distribution, average_trust_score,
    trust_histogram, daily_trend, field_error_frequency, recent_submissions,
  } = data

  const errorRate = total_submissions > 0 ? Math.round((severity_distribution.RED   / total_submissions) * 100) : 0
  const cleanRate = total_submissions > 0 ? Math.round((severity_distribution.GREEN / total_submissions) * 100) : 0

  const severityPieData = [
    { name: isAr ? 'أخضر' : 'Green',  value: severity_distribution.GREEN,  color: '#16a34a' },
    { name: isAr ? 'أصفر' : 'Yellow', value: severity_distribution.YELLOW, color: '#f59e0b' },
    { name: isAr ? 'أحمر' : 'Red',    value: severity_distribution.RED,    color: '#ef4444' },
  ].filter(d => d.value > 0)

  const tableHeaders = [
    t('dashboard.table.headers.surveyId'),
    t('dashboard.table.headers.respondent'),
    t('dashboard.table.headers.trust'),
    t('dashboard.table.headers.severity'),
    t('dashboard.table.headers.classification'),
    t('dashboard.table.headers.ms'),
    t('dashboard.table.headers.submitted'),
  ]

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-green-900 tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-sm text-green-600 mt-0.5">{t('dashboard.subtitle')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}
          className="gap-1.5 text-xs h-8 border-green-200 text-green-600 hover:text-green-900 hover:bg-green-50 bg-white">
          <RefreshCw size={11} /> {t('dashboard.refresh')}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label={t('dashboard.kpi.totalSubmissions')} value={total_submissions}
          sub={t('dashboard.kpi.allTime')} icon={FileText} />
        <KpiCard label={t('dashboard.kpi.avgTrustScore')} value={average_trust_score}
          sub={t('dashboard.kpi.outOf100')} icon={TrendingUp}
          valueClass={average_trust_score >= 70 ? 'text-green-600' : average_trust_score >= 40 ? 'text-amber-500' : 'text-red-500'} />
        <KpiCard label={t('dashboard.kpi.hardErrors')} value={severity_distribution.RED}
          sub={`${errorRate}${t('dashboard.kpi.ofTotal')}`} icon={AlertCircle} valueClass="text-red-500" />
        <KpiCard label={t('dashboard.kpi.cleanRecords')} value={severity_distribution.GREEN}
          sub={`${cleanRate}${t('dashboard.kpi.ofTotal')}`} icon={CheckCircle} valueClass="text-green-600" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2 border-green-200 shadow-none rounded-md bg-white">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-sm font-medium text-green-800">
              {t('dashboard.charts.severityDistribution')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={severityPieData} cx="50%" cy="50%" innerRadius={46} outerRadius={70}
                  paddingAngle={3} dataKey="value">
                  {severityPieData.map(e => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} ${t('dashboard.charts.records')}`]}
                  contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-5 mt-1">
              {severityPieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs text-green-600">
                    {d.name} <span className="font-semibold text-green-900">{d.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-green-200 shadow-none rounded-md bg-white">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-sm font-medium text-green-800">
              {t('dashboard.charts.trustScoreDistribution')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={trust_histogram} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="2 2" stroke="#dcfce7" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: '#86efac' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#86efac' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name={t('dashboard.charts.records')} radius={[3, 3, 0, 0]}>
                  {trust_histogram.map(e => {
                    const c = e.bucket === '80-100' ? '#16a34a' : e.bucket === '60-79' ? '#22c55e'
                      : e.bucket === '40-59' ? '#f59e0b' : e.bucket === '20-39' ? '#f97316' : '#ef4444'
                    return <Cell key={e.bucket} fill={c} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-green-200 shadow-none rounded-md bg-white">
          <CardHeader className="pb-1 pt-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-green-800">
                  {t('dashboard.charts.submissionTrend')}
                </CardTitle>
                <p className="text-xs text-green-500 mt-0.5">{t('dashboard.charts.last7Days')}</p>
              </div>
              <Activity size={13} className="text-green-300" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {daily_trend.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-green-400 text-sm">
                {t('dashboard.charts.noData')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={daily_trend}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#dcfce7" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#86efac' }}
                    tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#86efac' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="green"  stroke="#16a34a" strokeWidth={1.5} dot={{ r: 2.5, fill: '#16a34a' }} name={isAr ? 'أخضر' : 'Green'} />
                  <Line type="monotone" dataKey="yellow" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2.5, fill: '#f59e0b' }} name={isAr ? 'أصفر' : 'Yellow'} />
                  <Line type="monotone" dataKey="red"    stroke="#ef4444" strokeWidth={1.5} dot={{ r: 2.5, fill: '#ef4444' }} name={isAr ? 'أحمر' : 'Red'} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-green-200 shadow-none rounded-md bg-white">
          <CardHeader className="pb-1 pt-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-green-800">
                  {t('dashboard.charts.topErrorFields')}
                </CardTitle>
              </div>
              <BarChart2 size={13} className="text-green-300" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {field_error_frequency.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-green-400 text-sm">
                {t('dashboard.charts.noErrors')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={field_error_frequency} layout="vertical" margin={{ left: 70, right: 8 }} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="2 2" stroke="#dcfce7" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#86efac' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="field" tick={{ fontSize: 10, fill: '#4ade80' }} width={70}
                    axisLine={false} tickLine={false} tickFormatter={v => v.replace(/_/g, ' ')} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name={isAr ? 'أخطاء' : 'Errors'} fill="#16a34a" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions Table */}
      <Card className="border-green-200 shadow-none rounded-md overflow-hidden bg-white">
        <CardHeader className="pb-3 pt-4 px-5 border-b border-green-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-green-800">{t('dashboard.table.title')}</CardTitle>
            <span className="text-xs text-green-500">
              {t('dashboard.table.shown', { count: recent_submissions.length })}
            </span>
          </div>
        </CardHeader>
        <Separator className="bg-green-100" />
        <Table>
          <TableHeader>
            <TableRow className="border-green-100 hover:bg-transparent">
              {tableHeaders.map(h => (
                <TableHead key={h} className="text-[10px] text-green-500 font-medium py-2 px-4 uppercase tracking-wide">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent_submissions.map((row) => (
              <TableRow key={row.id} className="border-green-100 hover:bg-green-50/60">
                <TableCell className="font-mono text-[11px] text-green-600 py-2.5 px-4">{row.survey_id}</TableCell>
                <TableCell className="font-mono text-[11px] text-green-600 py-2.5 px-4">{row.respondent_id}</TableCell>
                <TableCell className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-semibold tabular-nums w-6', {
                      'text-green-600': row.trust_score >= 70,
                      'text-amber-500': row.trust_score >= 40 && row.trust_score < 70,
                      'text-red-500':   row.trust_score < 40,
                    })}>{row.trust_score}</span>
                    <div className="w-12 h-1 rounded-full bg-green-100 overflow-hidden">
                      <div className={cn('h-full rounded-full', {
                        'bg-green-500': row.trust_score >= 70,
                        'bg-amber-400': row.trust_score >= 40 && row.trust_score < 70,
                        'bg-red-500':   row.trust_score < 40,
                      })} style={{ width: `${row.trust_score}%` }} />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <SeverityDot severity={row.severity} />
                    <span className="text-[11px] text-green-700">{row.severity}</span>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 px-4">
                  {row.classification ? (
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 h-4 font-normal rounded-sm', {
                      'border-red-200 text-red-500':    row.classification === 'HARD_ERROR',
                      'border-amber-200 text-amber-500': row.classification === 'SOFT_WARNING',
                      'border-blue-200 text-blue-500':   row.classification === 'PLAUSIBLE_OUTLIER',
                    })}>
                      {row.classification.replace(/_/g, ' ')}
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-green-600">{t('dashboard.table.clean')}</span>
                  )}
                </TableCell>
                <TableCell className="text-[11px] text-green-500 tabular-nums py-2.5 px-4">{row.processing_time_ms}</TableCell>
                <TableCell className="text-[11px] text-green-500 py-2.5 px-4">
                  {row.created_at ? new Date(row.created_at).toLocaleString(isAr ? 'ar-SA' : 'en-GB', {
                    month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
                  }) : '—'}
                </TableCell>
              </TableRow>
            ))}
            {recent_submissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-green-400 text-sm py-10">
                  {t('dashboard.table.noSubmissions')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
