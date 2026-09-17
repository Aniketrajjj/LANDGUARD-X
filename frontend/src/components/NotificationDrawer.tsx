import { X } from 'lucide-react'

const NOTIFICATIONS = [
  { icon: '🚨', text: 'Critical risk detected in Dharamshala zone', time: '4m ago' },
  { icon: '⚠️', text: 'Heavy rainfall forecast for Joshimath region', time: '18m ago' },
  { icon: '📍', text: 'New citizen hazard report received (LGX-1042)', time: '32m ago' },
  { icon: '🚧', text: 'Road vulnerability identified near NH-503', time: '1h ago' },
  { icon: '🚑', text: 'Response team dispatched to Mussoorie', time: '3h ago' },
]

export default function NotificationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-80 bg-base-800 border-l border-base-600 z-50 fade-in flex flex-col">
        <div className="flex items-center justify-between px-4 h-16 border-b border-base-600 shrink-0">
          <span className="font-semibold text-sm">Notifications</span>
          <button onClick={onClose} className="text-base-400 hover:text-base-100">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {NOTIFICATIONS.map((n, i) => (
            <div key={i} className="px-4 py-3 border-b border-base-600/50 flex gap-3 hover:bg-base-700/40">
              <span className="text-lg leading-none">{n.icon}</span>
              <div>
                <div className="text-sm text-base-100">{n.text}</div>
                <div className="text-[11px] text-base-400 mt-0.5">{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
