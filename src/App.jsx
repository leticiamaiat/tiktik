import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Principal from './pages/Principal'
import Login from './pages/Login'
import Home from './pages/Home'
import MapaDeEntregas from './pages/MapaDeEntregas'
import Dashboard from './pages/Dashboard'
import MeusTiks from './pages/MeusTiks'
import TikDetalhe from './pages/TikDetalhe'
import Tikgram from './pages/Tikgram'
import Colaboradores from './pages/Colaboradores'
import IntegracaoRedes from './pages/IntegracaoRedes'
import EditarPerfil from './pages/EditarPerfil'
import TermosDeUso from './pages/TermosDeUso'

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <BrowserRouter>
        <Routes>
          <Route path="/principal" element={<Principal />} />
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Principal />} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/mapa-de-entregas" element={<ProtectedRoute><MapaDeEntregas /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/meus-tiks" element={<ProtectedRoute><MeusTiks /></ProtectedRoute>} />
          <Route path="/tik/:id" element={<ProtectedRoute><TikDetalhe /></ProtectedRoute>} />
          <Route path="/tikgram" element={<ProtectedRoute><Tikgram /></ProtectedRoute>} />
          <Route path="/colaboradores" element={<ProtectedRoute><Colaboradores /></ProtectedRoute>} />
          <Route path="/integracao-redes" element={<ProtectedRoute><IntegracaoRedes /></ProtectedRoute>} />
          <Route path="/editar-perfil" element={<ProtectedRoute><EditarPerfil /></ProtectedRoute>} />
          <Route path="/termos-de-uso" element={<ProtectedRoute><TermosDeUso /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
