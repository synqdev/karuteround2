'use client'
import { useState } from 'react'
import { Sun, Globe } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'

// Phase 1 placeholder staff — replaced with real auth user in Phase 3
const PLACEHOLDER_STAFF = [
  { id: 'staff-1', name: 'Yuki Tanaka', initials: 'YT' },
  { id: 'staff-2', name: 'Hana Sato', initials: 'HS' },
  { id: 'staff-3', name: 'Kenji Mori', initials: 'KM' },
]

export function AppHeader() {
  const [currentStaff, setCurrentStaff] = useState(PLACEHOLDER_STAFF[0])
  const [locale, setLocale] = useState<'EN' | 'JP'>('EN')

  function toggleTheme() {
    // Theme toggle — full next-themes integration added in 01-05 (i18n/theme plan)
    // For now, toggle the dark class on the html element
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-background">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle — sun icon per mockup */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5" />
        </Button>

        {/* EN/JP language toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocale(l => l === 'EN' ? 'JP' : 'EN')}
          className="font-medium text-sm min-w-[3rem]"
          aria-label="Toggle language"
        >
          <Globe className="h-4 w-4 mr-1" />
          {locale}
        </Button>

        {/* Staff avatar + name + dropdown — switching staff changes recording attribution */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium hover:bg-muted transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-muted text-foreground text-xs">
                {currentStaff.initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:inline">{currentStaff.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {PLACEHOLDER_STAFF.map((staff) => (
              <DropdownMenuItem
                key={staff.id}
                onClick={() => setCurrentStaff(staff)}
                className={currentStaff.id === staff.id ? 'bg-accent' : ''}
              >
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarFallback className="bg-muted text-foreground text-xs">
                    {staff.initials}
                  </AvatarFallback>
                </Avatar>
                {staff.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
