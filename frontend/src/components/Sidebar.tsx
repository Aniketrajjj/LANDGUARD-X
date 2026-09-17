import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Map, TrendingUp, FileWarning, ShieldAlert, Siren, BarChart3 } from 'lucide-react'

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/map', label: 'Risk Map', icon: Map },
  { to: '/forecast', label: 'Forecast', icon: TrendingUp },
  { to: '/citizen', label: 'Citizen Reports', icon: FileWarning },
  { to: '/authority', label: 'Authority Command', icon: ShieldAlert },
  { to: '/incidents', label: 'Incidents', icon: Siren },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-base-600/60 bg-base-900/60 py-4 hidden lg:flex flex-col gap-1 px-3">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-accent/15 text-accent' : 'text-base-300 hover:bg-base-800 hover:text-base-100'
            }`
          }
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}

      <div className="mt-auto px-3 pt-4 border-t border-base-600/60">
        <p className="text-[11px] leading-relaxed text-base-400">
          LANDGUARD-X is a decision-support prototype. Risk estimates are probabilistic
          and should be validated against authoritative observations before operational deployment.
        </p>
      </div>
    </aside>
  )
}
