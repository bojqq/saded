import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SurveyForm } from '@/components/SurveyForm/SurveyForm'
import { DashboardPage } from '@/pages/DashboardPage'
import { ClipboardList, BarChart2, Search, Settings, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

type Page = 'validate' | 'dashboard'

export default function App() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState<Page>('validate')
  const isAr = i18n.language === 'ar'

  const toggleLang = () => {
    const next = isAr ? 'en' : 'ar'
    i18n.changeLanguage(next)
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = next
    localStorage.setItem('lang', next)
  }

  const NAV = [
    { id: 'validate' as Page, icon: ClipboardList, label: t('nav.validate') },
    { id: 'dashboard' as Page, icon: BarChart2, label: t('nav.dashboard') },
  ]

  return (
    <div className="flex h-screen bg-white overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-52 shrink-0 bg-green-900 flex flex-col border-e border-green-800">

        {/* Brand */}
        <div className="px-4 py-4 border-b border-green-800">
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold leading-none">{t('brand.name')}</p>
            <p className="text-green-300 text-[11px] mt-0.5 truncate">{t('brand.subtitle')}</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2.5 border-b border-green-800">
          <div className="flex items-center gap-2 bg-green-800 rounded-md px-2.5 py-1.5 cursor-text">
            <Search size={11} className="text-green-400 shrink-0" />
            <span className="text-green-400 text-xs">{t('search')}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          <p className="text-green-500 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2">
            {t('nav.operations')}
          </p>
          {NAV.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors text-start',
                page === id
                  ? 'bg-green-700 text-white'
                  : 'text-green-300 hover:text-white hover:bg-green-800'
              )}
            >
              <Icon size={14} className={page === id ? 'text-green-300' : 'text-green-500'} />
              {label}
            </button>
          ))}

          <div className="pt-4">
            <p className="text-green-500 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2">
              {t('nav.management')}
            </p>
            {([
              { icon: Settings, key: 'nav.settings' },
              { icon: User,     key: 'nav.account'  },
            ]).map(({ icon: Icon, key }) => (
              <button
                key={key}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-green-400 hover:text-white hover:bg-green-800 transition-colors text-start"
              >
                <Icon size={14} />
                {t(key)}
              </button>
            ))}
          </div>
        </nav>

        <Separator className="bg-green-800" />

        {/* User */}
        <div className="px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-green-700 flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold">
                {isAr ? 'ه' : 'G'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium leading-none">{t('user.name')}</p>
              <p className="text-green-400 text-[10px] mt-0.5 truncate">{t('user.role')}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="flex items-center justify-between px-6 h-11 border-b border-green-100 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <button
              onClick={toggleLang}
              className="flex items-center rounded-md border border-green-200 overflow-hidden text-[11px] font-semibold"
            >
              <span className={cn(
                'px-2.5 py-1 transition-colors',
                isAr ? 'bg-green-700 text-white' : 'text-green-600 hover:bg-green-50'
              )}>
                AR
              </span>
              <span className={cn(
                'px-2.5 py-1 transition-colors',
                !isAr ? 'bg-green-700 text-white' : 'text-green-600 hover:bg-green-50'
              )}>
                EN
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-green-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {t('topbar.live')}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-green-50/30">
          {page === 'validate' ? <SurveyForm /> : <DashboardPage />}
        </main>
      </div>
    </div>
  )
}
