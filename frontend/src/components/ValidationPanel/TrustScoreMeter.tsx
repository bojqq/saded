import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  score: number
  severity: 'GREEN' | 'YELLOW' | 'RED'
  processingMs?: number
}

const config = {
  GREEN:  { scoreClass: 'text-green-700',  barClass: 'bg-green-500',  borderClass: 'border-green-300',  bgClass: 'bg-green-50'  },
  YELLOW: { scoreClass: 'text-amber-600',  barClass: 'bg-amber-400',  borderClass: 'border-amber-300',  bgClass: 'bg-amber-50'  },
  RED:    { scoreClass: 'text-red-600',    barClass: 'bg-red-500',    borderClass: 'border-red-300',    bgClass: 'bg-red-50'    },
}

export function TrustScoreMeter({ score, severity, processingMs }: Props) {
  const { t } = useTranslation()
  const c = config[severity]

  return (
    <Card className={cn('shadow-none rounded-md border', c.borderClass, c.bgClass)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-green-700">{t('trustScore.title')}</span>
          {processingMs && (
            <span className="text-[11px] text-green-500 font-mono">
              {t('trustScore.processing', { ms: processingMs })}
            </span>
          )}
        </div>
        <div className="flex items-end gap-2 mb-3">
          <span className={cn('text-4xl font-bold tabular-nums tracking-tight', c.scoreClass)}>{score}</span>
          <span className="text-green-300 text-lg mb-0.5">/100</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/60 overflow-hidden mb-2.5">
          <div className={cn('h-full rounded-full transition-all duration-500', c.barClass)}
            style={{ width: `${score}%` }} />
        </div>
        <span className={cn('text-xs font-semibold', c.scoreClass)}>
          {t(`trustScore.severity.${severity}`)}
        </span>
      </CardContent>
    </Card>
  )
}
