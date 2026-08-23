import { Link } from '@tanstack/react-router'
import {
  Banknote,
  BriefcaseBusiness,
  CalendarCheck2,
  CircleUserRound,
  Compass,
  Flag,
  Heart,
  Images,
  LayoutDashboard,
  Sparkles,
  Trophy,
} from 'lucide-react'

import ThemeToggle from './ThemeToggle'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/journey', label: 'Journey', icon: Compass },
  { to: '/missions', label: 'Missions', icon: CalendarCheck2 },
  { to: '/finance', label: 'Finance', icon: Banknote },
  { to: '/career', label: 'Career', icon: BriefcaseBusiness },
  { to: '/skills', label: 'Skills', icon: Sparkles },
  { to: '/future', label: 'Future', icon: Flag },
  { to: '/memories', label: 'Memories', icon: Images },
  { to: '/achievements', label: 'Badges', icon: Trophy },
  { to: '/reviews', label: 'Reviews', icon: Heart },
  { to: '/settings', label: 'Settings', icon: CircleUserRound },
] as const

export default function Header() {
  return (
    <header className="app-header">
      <div className="header-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Compass size={19} />
          </span>
          <span>
            <strong>Naoshima Bound</strong>
            <small>MY ISLAND JOURNEY</small>
          </span>
        </Link>
        <nav className="main-nav" aria-label="メインナビゲーション">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className="nav-link"
                activeProps={{ className: 'nav-link is-active' }}
                activeOptions={{ exact: item.to === '/' }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  )
}
