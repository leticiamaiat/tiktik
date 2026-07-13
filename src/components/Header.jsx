import { Menu } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import logo from '../assets/00_logo_2.png'

export default function Header({ onMenuToggle }) {
  const { user } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm h-14 flex items-center justify-between px-4">
      {/* Logo */}
      <div className="flex items-center">
        <img src={logo} alt="Tik" className="h-8 w-auto select-none" />
      </div>

      {/* User info + menu */}
      {user && (
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-700 leading-none">{user.firstName || (user.name || user.email || '').split(' ')[0]}</p>
            <p className="text-xs text-gray-400 leading-none mt-0.5">{user.email}</p>
            <p className="text-xs text-tik-orange leading-none mt-0.5">{user.plan}</p>
          </div>
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-tik-orange flex items-center justify-center border-2 border-gray-200">
              <span className="text-white text-sm font-bold">{(user.name || user.email || '?')[0].toUpperCase()}</span>
            </div>
          )}
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
