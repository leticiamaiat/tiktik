import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const menuItems = [
  { label: 'Fazer um tik', path: '/' },
  { label: 'Mapa de entregas', path: '/mapa-de-entregas' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Meus tiks', path: '/meus-tiks' },
  { label: 'Tikgram', path: '/tikgram' },
  { label: 'Colaboradores', path: '/colaboradores' },
  { label: 'Integração com redes sociais', path: '/integracao-redes' },
  { label: 'Editar meu perfil', path: '/editar-perfil' },
  { label: 'Termos de uso', path: '/termos-de-uso' },
  { label: 'Sair', path: null },
]

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleClick = (item) => {
    if (item.path === null) {
      logout()
      navigate('/login')
    } else {
      navigate(item.path)
    }
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-52 z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: '#D4701A' }}
      >
        <div className="pt-14">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleClick(item)}
              className="w-full text-left text-white text-sm py-3 px-5 hover:bg-white/10 transition-colors block"
            >
              {item.label}
            </button>
          ))}
        </div>
      </aside>
    </>
  )
}
