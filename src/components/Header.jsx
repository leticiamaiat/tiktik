import { Menu } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Header({ onMenuToggle }) {
  const { user } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm h-14 flex items-center justify-between px-4">
      {/* Logo */}
      <div className="flex items-center">
        <span className="text-2xl font-bold tracking-tight select-none">
          <span className="text-gray-800">ti</span>
          <span className="relative inline-block">
            <span className="text-gray-800">k</span>
            <span
              className="absolute -top-1 left-0 text-tik-orange font-black"
              style={{ transform: 'rotate(-15deg)', fontSize: '1.1em' }}
            >
              ✕
            </span>
          </span>
        </span>
      </div>

      {/* User info + menu */}
      {user && (
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-700 leading-none">{user.firstName || user.name.split(' ')[0]}</p>
            <p className="text-xs text-gray-400 leading-none mt-0.5">{user.email}</p>
            <p className="text-xs text-tik-orange leading-none mt-0.5">{user.plan}</p>
          </div>
          <img
            src={user.avatar}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
          />
          <button
            onClick={onMenuToggle}
            className="flex flex-col gap-1 p-1 cursor-pointer"
          >
            <Menu size={22} className="text-gray-600" />
            <span className="text-[9px] text-gray-500 font-semibold tracking-widest -mt-1">MENU</span>
          </button>
        </div>
      )}
    </header>
  )
}
