'use client'

import { Globe, Moon, Sun, ChevronLeft } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

export function Header({
  title,
  backButton = false,
  onBack
}: {
  title?: string,
  backButton?: boolean,
  onBack?: () => void
}) {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale, t } = useI18n()
  const router = useRouter()

  const handleBack = () => {
    if (onBack) onBack()
    else router.back()
  }

  const toggleTheme = (event: React.MouseEvent) => {
    const isDark = theme === 'dark'

    // If View Transitions API is not supported, just switch theme
    if (!document.startViewTransition) {
      setTheme(isDark ? 'light' : 'dark')
      return
    }

    const x = event.clientX
    const y = event.clientY
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    )

    const transition = document.startViewTransition(() => {
      setTheme(isDark ? 'light' : 'dark')
    })

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ]
      document.documentElement.animate(
        {
          clipPath: isDark ? [...clipPath].reverse() : clipPath,
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: isDark
            ? '::view-transition-old(root)'
            : '::view-transition-new(root)',
        }
      )
    })
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-between h-16 px-4 max-w-screen-xl mx-auto">
        <div className="flex items-center gap-3">
          {backButton && (
            <Button variant="ghost" size="icon" className="h-10 w-10 -ml-2 rounded-xl" onClick={handleBack}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          <h1 className="text-xl font-bold text-foreground tracking-tight truncate max-w-[200px]">
            {title || t.home.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl border border-transparent hover:border-border hover:bg-secondary transition-all"
              >
                <Globe className="h-5 w-5 text-muted-foreground" />
                <span className="sr-only">{t.common.language}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[140px]">
              <DropdownMenuItem onClick={() => setLocale('en')} className="rounded-xl px-3 py-2 cursor-pointer">
                <span className="flex-1">English</span> {locale === 'en' && <span className="text-primary font-bold ml-2">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale('ru')} className="rounded-xl px-3 py-2 cursor-pointer">
                <span className="flex-1">Русский</span> {locale === 'ru' && <span className="text-primary font-bold ml-2">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale('kk')} className="rounded-xl px-3 py-2 cursor-pointer">
                <span className="flex-1">Қазақша</span> {locale === 'kk' && <span className="text-primary font-bold ml-2">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl relative group overflow-hidden border border-transparent hover:border-border hover:bg-secondary transition-all"
            onClick={toggleTheme}
          >
            <div className="relative h-5 w-5">
              <Sun className="h-5 w-5 absolute inset-0 rotate-0 scale-100 transition-all duration-500 transform-gpu dark:-rotate-90 dark:scale-0 text-amber-500" />
              <Moon className="h-5 w-5 absolute inset-0 rotate-90 scale-0 transition-all duration-500 transform-gpu dark:rotate-0 dark:scale-100 text-indigo-400 font-bold" />
            </div>
            <span className="sr-only">{t.common.theme}</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
