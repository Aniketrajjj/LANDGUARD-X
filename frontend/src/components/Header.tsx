import { useEffect, useRef, useState } from 'react'
import { Mountain, Search, MapPin, Bell, ShieldCheck, WifiOff } from 'lucide-react'
import { useAppState } from '../hooks/useAppState'
import NotificationDrawer from './NotificationDrawer'

export default function Header() {
  const { locations, selectedLocationId, setSelectedLocationId, offline } = useAppState()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const selected = locations.find((l) => l.id === selectedLocationId)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const filtered = locations.filter((l) =>
    l.name.toLowerCase().includes(query.toLowerCase()) || l.state.toLowerCase().includes(query.toLowerCase())
  )

  function useMyLocation() {
    // Demo geolocation: nearest matching Himalayan demo location, defaulting to Dharamshala
    if (!navigator.geolocation) {
      setSelectedLocationId('dharamshala')
      return
    }
    navigator.geolocation.getCurrentPosition(
      () => setSelectedLocationId('dharamshala'),
      () => setSelectedLocationId('dharamshala')
    )
  }

  return (
    <header className="h-16 shrink-0 border-b border-base-600/60 bg-base-900/80 backdrop-blur flex items-center justify-between px-5 gap-4 relative z-30">
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-dim flex items-center justify-center">
          <Mountain size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="font-bold text-base tracking-tight text-base-100">LANDGUARD-X</div>
          <div className="text-[11px] text-base-300 -mt-0.5">AI-Powered Landslide Risk Intelligence</div>
        </div>
      </div>

      <div className="flex-1 max-w-md relative" ref={boxRef}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-400" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder={selected ? `${selected.name}, ${selected.state}` : 'Search location...'}
            className="w-full bg-base-800 border border-base-600 rounded-lg pl-9 pr-3 py-2 text-sm text-base-100 placeholder:text-base-400 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </div>
        {open && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-base-800 border border-base-600 rounded-lg shadow-xl max-h-72 overflow-auto fade-in">
            <button
              onClick={() => { useMyLocation(); setOpen(false); setQuery('') }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-accent hover:bg-base-700 text-left border-b border-base-600/60"
            >
              <MapPin size={14} /> Use My Location
            </button>
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-sm text-base-400">No matching location in demo dataset.</div>
            )}
            {filtered.map((l) => (
              <button
                key={l.id}
                onClick={() => { setSelectedLocationId(l.id); setOpen(false); setQuery('') }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-base-700 ${l.id === selectedLocationId ? 'text-accent' : 'text-base-100'}`}
              >
                <span>{l.name}</span>
                <span className="text-base-400 text-xs">{l.state}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {offline && (
          <div className="flex items-center gap-1.5 text-[11px] text-base-300 bg-base-800 border border-base-600 px-2.5 py-1 rounded-full">
            <WifiOff size={12} /> Demo data
          </div>
        )}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-risk-low bg-risk-low/10 border border-risk-low/30 px-3 py-1.5 rounded-full">
          <ShieldCheck size={13} /> SYSTEM OPERATIONAL
        </div>
        <button
          onClick={() => setNotifOpen(true)}
          className="relative w-9 h-9 rounded-lg bg-base-800 border border-base-600 flex items-center justify-center hover:border-accent transition-colors"
        >
          <Bell size={16} className="text-base-200" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-risk-high text-[9px] font-bold flex items-center justify-center text-white">3</span>
        </button>
      </div>

      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </header>
  )
}
