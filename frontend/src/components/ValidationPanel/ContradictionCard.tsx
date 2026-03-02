import { useTranslation } from 'react-i18next'
import { AlertTriangle, AlertCircle, Info, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ValidationFlag } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Props {
  flag: ValidationFlag
  onAccept?: (field: string, value: unknown) => void
  onReject?: () => void
}

const typeConfig = {
  HARD_ERROR:        { icon: AlertCircle,   border: 'border-red-200',    badge: 'border-red-200 text-red-600',    bg: 'bg-white' },
  SOFT_WARNING:      { icon: AlertTriangle,  border: 'border-amber-200', badge: 'border-amber-200 text-amber-600', bg: 'bg-white' },
  PLAUSIBLE_OUTLIER: { icon: Info,           border: 'border-green-200', badge: 'border-green-300 text-green-700', bg: 'bg-white' },
}

export function ContradictionCard({ flag, onAccept, onReject }: Props) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const c = typeConfig[flag.type]
  const Icon = c.icon

  return (
    <Card className={cn('shadow-none rounded-md border', c.border, c.bg)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon size={15} className={cn('mt-0.5 shrink-0', {
            'text-red-500':   flag.type === 'HARD_ERROR',
            'text-amber-500': flag.type === 'SOFT_WARNING',
            'text-green-600': flag.type === 'PLAUSIBLE_OUTLIER',
          })} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={cn('text-[10px] px-1.5 h-4 font-normal rounded-sm', c.badge)}>
                {t(`contradiction.types.${flag.type}`)}
              </Badge>
              <span className="text-[10px] text-green-500 font-mono">{flag.fields.join(' ↔ ')}</span>
            </div>

            <p className="text-sm text-green-900 leading-relaxed mb-1" dir="rtl">
              {isAr ? flag.description_ar : flag.description_en}
            </p>
            {isAr && (
              <p className="text-xs text-green-500">{flag.description_en}</p>
            )}

            {flag.suggested_correction && (
              <div className="mt-3 p-3 rounded-md bg-green-50 border border-green-200">
                <p className="text-[10px] text-green-600 mb-1.5 uppercase tracking-wide font-medium">
                  {t('contradiction.suggestedFix')}
                </p>
                <p className="text-xs text-green-800">
                  <span className="font-semibold text-green-900">{flag.suggested_correction.field}</span>
                  <span className="text-green-300 mx-1.5">→</span>
                  <span className="font-semibold text-green-700">{String(flag.suggested_correction.value)}</span>
                  <span className="text-green-500 ms-2 font-mono">
                    {t('contradiction.confidence', { pct: Math.round(flag.suggested_correction.confidence * 100) })}
                  </span>
                </p>
                {(onAccept || onReject) && (
                  <div className="flex gap-2 mt-2.5">
                    {onAccept && (
                      <Button size="sm" onClick={() => onAccept(flag.suggested_correction!.field, flag.suggested_correction!.value)}
                        className="h-7 px-3 text-xs gap-1.5 bg-green-800 hover:bg-green-900 text-white font-semibold">
                        <Check size={11} /> {t('contradiction.accept')}
                      </Button>
                    )}
                    {onReject && (
                      <Button size="sm" variant="outline" onClick={onReject}
                        className="h-7 px-3 text-xs gap-1.5 border-green-200 text-green-600 hover:text-green-900 hover:bg-green-50 bg-white">
                        <X size={11} /> {t('contradiction.dismiss')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
