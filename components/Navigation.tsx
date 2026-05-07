'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, History, AlertTriangle } from 'lucide-react'

const links = [
  { href: '/',           label: 'Home',       icon: Home },
  { href: '/materiali',  label: 'Materiali',  icon: Package },
  { href: '/movimenti',  label: 'Movimenti',  icon: History },
  { href: '/alert',      label: 'Alert',      icon: AlertTriangle },
]

export default function Navigation({ alertCount = 0 }: { alertCount?: number }) {
  const path = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {links.map(({ href, label, icon: Icon }) => {
          const active = path === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors relative ${
                active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                {href === '/alert' && alertCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
