'use client'

import { Search } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Input } from '@/components/ui/input'

export function SearchBar() {
  const { t } = useI18n()

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        type="search"
        placeholder={t.common.search}
        className="h-12 pl-10 pr-4 rounded-xl border-2"
      />
    </div>
  )
}
