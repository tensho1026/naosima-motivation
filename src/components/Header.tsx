import { Link } from '@tanstack/react-router'
import {
  Banknote,
  CalendarCheck2,
  CircleUserRound,
  Compass,
  Heart,
  Images,
  LayoutDashboard,
  // FEATURE_ARCHIVE: uncomment these icons with the archived nav entries below.
  // BriefcaseBusiness,
  // Flag,
  // ListTodo,
  // Sparkles,
  // Trophy,
} from 'lucide-react'

import ThemeToggle from './ThemeToggle'

const navItems = [
  { to: '/', label: 'ホーム', icon: LayoutDashboard },
  { to: '/journey', label: '移住計画', icon: Compass },
  { to: '/missions', label: '行動', icon: CalendarCheck2 },
  { to: '/finance', label: '資金', icon: Banknote },
  { to: '/memories', label: '思い出', icon: Images },
  { to: '/reviews', label: '振り返り', icon: Heart },
  { to: '/settings', label: '設定', icon: CircleUserRound },
  // FEATURE_ARCHIVE_BEGIN: removed top-level features. Uncomment together
  // with the corresponding icon imports and route implementation.
  // { to: '/todos', label: 'Todo', icon: ListTodo },
  // { to: '/career', label: '仕事', icon: BriefcaseBusiness },
  // { to: '/skills', label: 'スキル', icon: Sparkles },
  // { to: '/future', label: '未来', icon: Flag },
  // { to: '/achievements', label: '称号', icon: Trophy },
  // FEATURE_ARCHIVE_END
] as const

const mobileNavItems = [
  { to: '/', label: 'ホーム', icon: LayoutDashboard },
  { to: '/journey', label: '移住計画', icon: Compass },
  { to: '/missions', label: '行動', icon: CalendarCheck2 },
  { to: '/finance', label: '資金', icon: Banknote },
  { to: '/settings', label: 'その他', icon: CircleUserRound },
  // FEATURE_ARCHIVE: { to: '/todos', label: 'Todo', icon: ListTodo },
] as const

export default function Header() {
  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <Compass size={19} />
            </span>
            <span>
              <strong>Naoshima Bound</strong>
              <small>直島移住への旅</small>
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
      <nav className="mobile-nav" aria-label="モバイルナビゲーション">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: 'is-active' }}
              activeOptions={{ exact: item.to === '/' }}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
