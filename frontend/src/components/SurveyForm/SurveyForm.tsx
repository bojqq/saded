import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send, Loader2, ClipboardCheck, User, Briefcase, GraduationCap } from 'lucide-react'
import { validateSurvey, type ValidationResponse } from '@/lib/api'
import { TrustScoreMeter } from '@/components/ValidationPanel/TrustScoreMeter'
import { ContradictionCard } from '@/components/ValidationPanel/ContradictionCard'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const num = (min: number, max?: number) =>
  z.preprocess(v => Number(v), max !== undefined ? z.number().min(min).max(max) : z.number().min(min))

const schema = z.object({
  survey_id:           z.string().min(1),
  respondent_id:       z.string().min(1),
  // Personal
  age:                 num(14, 100),
  gender:              z.string().min(1),
  nationality:         z.string().min(1),
  marital_status:      z.string().min(1),
  region:              z.string().min(1),
  // Education
  education_level:     z.string().min(1),
  // Employment
  employment_status:   z.string().min(1),
  occupation:          z.string().min(1),
  work_sector:         z.string().min(1),
  weekly_work_hours:   num(0, 168),
  monthly_income_sar:  num(0),
  years_of_experience: num(0),
})
type FormData = z.infer<typeof schema>

// ── Demo profiles ─────────────────────────────────────────────────────────────
const DEMO_PROFILES = [
  {
    key: 's1',
    severity: 'RED' as const,
    // محمد العمري — جراح، عمره 21 — خطأ جسيم
    data: {
      age: 21, gender: 'male', nationality: 'saudi',
      marital_status: 'single', region: 'riyadh',
      education_level: 'primary',
      employment_status: 'employed', occupation: 'Cardiac Surgeon',
      work_sector: 'private', weekly_work_hours: 70,
      monthly_income_sar: 2500, years_of_experience: 18,
    },
  },
  {
    key: 's2',
    severity: 'YELLOW' as const,
    // نورة الغامدي — عاطلة بدخل مرتفع — تحذير
    data: {
      age: 29, gender: 'female', nationality: 'saudi',
      marital_status: 'married', region: 'jeddah',
      education_level: 'bachelor',
      employment_status: 'unemployed', occupation: 'None',
      work_sector: 'government', weekly_work_hours: 0,
      monthly_income_sar: 42000, years_of_experience: 0,
    },
  },
  {
    key: 's3',
    severity: 'GREEN' as const,
    // أحمد الشمري — مهندس حكومي — ملف صحيح
    data: {
      age: 34, gender: 'male', nationality: 'saudi',
      marital_status: 'married', region: 'riyadh',
      education_level: 'bachelor',
      employment_status: 'employed', occupation: 'Civil Engineer',
      work_sector: 'government', weekly_work_hours: 40,
      monthly_income_sar: 13500, years_of_experience: 9,
    },
  },
]

// ── Option lists ──────────────────────────────────────────────────────────────
const GENDERS      = ['male', 'female']
const NATIONALITIES = ['saudi', 'non_saudi']
const MARITAL      = ['single', 'married', 'divorced', 'widowed']
const REGIONS      = ['riyadh','makkah','madinah','eastern','asir','qassim','tabuk','hail','jizan','najran','jawf','bahah','northern']
const EDUCATION    = ['none','primary','intermediate','secondary','diploma','bachelor','postgraduate','doctorate']
const EMPLOYMENT   = ['employed','unemployed','not_in_labor_force']
const SECTORS      = ['government','private','self_employed','non_profit']

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <Icon size={13} className="text-green-500 shrink-0" />
      <span className="text-[11px] font-semibold text-green-600 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-green-100" />
    </div>
  )
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-green-800">{label}</Label>
      {children}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  )
}

const selectCls = (extra = '') =>
  `w-full h-9 px-3 text-sm border border-green-200 rounded-md bg-white text-green-900 focus:outline-none focus:ring-1 focus:ring-green-500 cursor-pointer ${extra}`

// ── Main component ────────────────────────────────────────────────────────────
export function SurveyForm() {
  const { t } = useTranslation()
  const [result, setResult]     = useState<ValidationResponse | null>(null)
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const { register, handleSubmit, setValue, reset, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema) as Resolver<FormData>,
      defaultValues: {
        survey_id:     `LFS-2025-${String(Date.now()).slice(-4)}`,
        respondent_id: `R-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      },
    })

  const loadProfile = (p: typeof DEMO_PROFILES[0]) => {
    reset({
      survey_id:     `LFS-2025-${String(Date.now()).slice(-4)}`,
      respondent_id: `R-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      ...p.data,
    })
    setResult(null)
    setError(null)
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)
    try {
      const { survey_id, respondent_id, ...fields } = data
      setResult(await validateSurvey({ survey_id, respondent_id, fields }))
    } catch {
      setError(t('survey.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = (field: string, value: unknown) =>
    setValue(field as keyof FormData, value as never)

  return (
    <div className="p-6 max-w-[1400px]">

      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-green-900 tracking-tight">{t('survey.title')}</h1>
        <p className="text-sm text-green-600 mt-0.5">{t('survey.subtitle')}</p>
      </div>

      {/* Demo scenarios */}
      <Card className="mb-5 border-green-200 shadow-none rounded-md bg-white">
        <CardContent className="p-4">
          <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wider mb-3">
            {t('survey.demoScenarios')}
          </p>
          <div className="flex flex-wrap gap-3">
            {DEMO_PROFILES.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => loadProfile(p)}
                className={cn(
                  'flex flex-col items-start gap-0.5 px-4 py-2.5 text-xs font-medium rounded-md border transition-colors text-start',
                  p.severity === 'RED'
                    ? 'border-red-200 text-red-700 hover:bg-red-50 bg-red-50/50'
                    : p.severity === 'YELLOW'
                    ? 'border-amber-200 text-amber-700 hover:bg-amber-50 bg-amber-50/50'
                    : 'border-green-300 text-green-800 hover:bg-green-50 bg-green-50/50'
                )}
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <span className={cn('w-2 h-2 rounded-full shrink-0', {
                    'bg-red-500':   p.severity === 'RED',
                    'bg-amber-400': p.severity === 'YELLOW',
                    'bg-green-500': p.severity === 'GREEN',
                  })} />
                  {t(`survey.scenarios.${p.key}Label`)}
                </span>
                <span className="text-[10px] opacity-70 ps-3.5">
                  {t(`survey.scenarios.${p.key}Hint`)}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Form ─────────────────────────────────────────────── */}
        <Card className="border-green-200 shadow-none rounded-md bg-white">
          <CardHeader className="pb-3 pt-4 px-5 border-b border-green-100">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={14} className="text-green-500" />
              <CardTitle className="text-sm font-medium text-green-800">{t('survey.formTitle')}</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

              {/* Admin IDs */}
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('survey.fields.surveyId')} error={errors.survey_id?.message}>
                  <Input {...register('survey_id')} className="h-9 text-sm border-green-200 text-green-900 focus-visible:ring-green-500 font-mono" />
                </Field>
                <Field label={t('survey.fields.respondentId')} error={errors.respondent_id?.message}>
                  <Input {...register('respondent_id')} className="h-9 text-sm border-green-200 text-green-900 focus-visible:ring-green-500 font-mono" />
                </Field>
              </div>

              {/* ─ Personal ─ */}
              <SectionHeader icon={User} label={t('survey.sections.personal')} />

              <div className="grid grid-cols-2 gap-3">
                <Field label={t('survey.fields.age')} error={errors.age?.message}>
                  <Input {...register('age')} type="number" placeholder="34"
                    className="h-9 text-sm border-green-200 text-green-900 focus-visible:ring-green-500" />
                </Field>
                <Field label={t('survey.fields.gender')} error={errors.gender?.message}>
                  <select {...register('gender')} className={selectCls()}>
                    <option value="">{t('survey.placeholders.selectGender')}</option>
                    {GENDERS.map(v => <option key={v} value={v}>{t(`survey.gender.${v}`)}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t('survey.fields.nationality')} error={errors.nationality?.message}>
                  <select {...register('nationality')} className={selectCls()}>
                    <option value="">{t('survey.placeholders.selectNationality')}</option>
                    {NATIONALITIES.map(v => <option key={v} value={v}>{t(`survey.nationality.${v}`)}</option>)}
                  </select>
                </Field>
                <Field label={t('survey.fields.maritalStatus')} error={errors.marital_status?.message}>
                  <select {...register('marital_status')} className={selectCls()}>
                    <option value="">{t('survey.placeholders.selectMarital')}</option>
                    {MARITAL.map(v => <option key={v} value={v}>{t(`survey.marital.${v}`)}</option>)}
                  </select>
                </Field>
              </div>

              <Field label={t('survey.fields.region')} error={errors.region?.message}>
                <select {...register('region')} className={selectCls()}>
                  <option value="">{t('survey.placeholders.selectRegion')}</option>
                  {REGIONS.map(v => <option key={v} value={v}>{t(`survey.regions.${v}`)}</option>)}
                </select>
              </Field>

              {/* ─ Education ─ */}
              <SectionHeader icon={GraduationCap} label={t('survey.sections.education')} />

              <Field label={t('survey.fields.educationLevel')} error={errors.education_level?.message}>
                <select {...register('education_level')} className={selectCls()}>
                  <option value="">{t('survey.placeholders.selectEducation')}</option>
                  {EDUCATION.map(v => <option key={v} value={v}>{t(`survey.education.${v}`)}</option>)}
                </select>
              </Field>

              {/* ─ Employment ─ */}
              <SectionHeader icon={Briefcase} label={t('survey.sections.employment')} />

              <Field label={t('survey.fields.employmentStatus')} error={errors.employment_status?.message}>
                <select {...register('employment_status')} className={selectCls()}>
                  <option value="">{t('survey.placeholders.selectEmployment')}</option>
                  {EMPLOYMENT.map(v => <option key={v} value={v}>{t(`survey.employment.${v}`)}</option>)}
                </select>
              </Field>

              <Field label={t('survey.fields.occupation')} error={errors.occupation?.message}>
                <Input {...register('occupation')} placeholder={t('survey.placeholders.occupation')}
                  className="h-9 text-sm border-green-200 text-green-900 focus-visible:ring-green-500" />
              </Field>

              <Field label={t('survey.fields.workSector')} error={errors.work_sector?.message}>
                <select {...register('work_sector')} className={selectCls()}>
                  <option value="">{t('survey.placeholders.selectWorkSector')}</option>
                  {SECTORS.map(v => <option key={v} value={v}>{t(`survey.sector.${v}`)}</option>)}
                </select>
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label={t('survey.fields.weeklyWorkHours')} error={errors.weekly_work_hours?.message}>
                  <Input {...register('weekly_work_hours')} type="number" placeholder="40"
                    className="h-9 text-sm border-green-200 text-green-900 focus-visible:ring-green-500" />
                </Field>
                <Field label={t('survey.fields.monthlyIncome')} error={errors.monthly_income_sar?.message}>
                  <Input {...register('monthly_income_sar')} type="number" placeholder="12000"
                    className="h-9 text-sm border-green-200 text-green-900 focus-visible:ring-green-500" />
                </Field>
                <Field label={t('survey.fields.yearsOfExperience')} error={errors.years_of_experience?.message}>
                  <Input {...register('years_of_experience')} type="number" placeholder="9"
                    className="h-9 text-sm border-green-200 text-green-900 focus-visible:ring-green-500" />
                </Field>
              </div>

              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-600">{error}</div>
              )}

              <Button type="submit" disabled={isLoading}
                className="w-full h-9 text-sm gap-2 bg-green-800 hover:bg-green-900 text-white font-semibold mt-1">
                {isLoading
                  ? <><Loader2 size={13} className="animate-spin" /> {t('survey.validating')}</>
                  : <><Send size={13} /> {t('survey.submitBtn')}</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Results ───────────────────────────────────────────── */}
        <div className="space-y-4">
          {!result && (
            <Card className="border-dashed border-green-200 shadow-none rounded-md h-full min-h-[500px] flex items-center justify-center bg-white">
              <CardContent className="flex flex-col items-center text-center p-8">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
                  <Send size={18} className="text-green-400" />
                </div>
                <p className="text-sm text-green-700 font-medium mb-1">{t('survey.emptyState')}</p>
                <p className="text-xs text-green-400">
                  {t('survey.title')} · {t('brand.name')}
                </p>
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              <TrustScoreMeter
                score={result.trust_score}
                severity={result.severity}
                processingMs={result.processing_time_ms}
              />

              {result.flags.length === 0 ? (
                <Card className="border-green-300 bg-green-50 shadow-none rounded-md">
                  <CardContent className="p-4 text-center">
                    <p className="text-green-700 text-sm font-medium">{t('survey.noContradictions')}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-xs text-green-600 font-medium">
                    {t('survey.issuesDetected_other', { count: result.flags.length })}
                  </p>
                  {result.flags.map((flag, i) => (
                    <ContradictionCard
                      key={i}
                      flag={flag}
                      onAccept={flag.suggested_correction ? handleAccept : undefined}
                      onReject={() => {}}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
