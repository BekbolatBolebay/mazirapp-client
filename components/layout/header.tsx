'use client'

import { Globe, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header({ title }: { title?: string }) {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale, t } = useI18n()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-between h-14 px-4 max-w-screen-xl mx-auto">
        <h1 className="text-lg font-bold text-primary">
          {title || t.home.title}
        </h1>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Globe className="h-5 w-5" />
                <span className="sr-only">{t.common.language}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLocale('en')}>
                English {locale === 'en' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale('ru')}>
                Қазақша {locale === 'ru' && '✓'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                <span className="sr-only">{t.common.theme}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                {t.common.light} {theme === 'light' && '✓'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                {t.common.dark} {theme === 'dark' && '✓'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
