import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import Home from './pages/Home'
import Login from './pages/Login'
import AppPage from './pages/AppPage'
import Finanzas from './pages/Finanzas'
import Cuentas from './pages/Cuentas'
import Presupuestos from './pages/Presupuestos'
import Transacciones from './pages/Transacciones'
import Deudas from './pages/Deudas'
import TarjetasDebito from './pages/TarjetasDebito'
import Subscripciones from './pages/Subscripciones'
import TarjetasCredito from './pages/TarjetasCredito'
import Proyectos from './pages/Proyectos'
import MeDeben from './pages/MeDeben'
import StatusBar from './components/StatusBar'
import ProtectedRoute from './components/ProtectedRoute'
import Footer from './components/Footer'

function AppContent() {
  const location = useLocation()
  const isLogin = location.pathname === '/login'

  // Scroll to top cuando cambia la ruta
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [location.pathname])

  return (
    <>
      <StatusBar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/finanzas" 
          element={
            <ProtectedRoute>
              <Finanzas />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/finanzas/cuentas" 
          element={
            <ProtectedRoute>
              <Cuentas />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/finanzas/presupuestos" 
          element={
            <ProtectedRoute>
              <Presupuestos />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/finanzas/transacciones" 
          element={
            <ProtectedRoute>
              <Transacciones />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/finanzas/deudas" 
          element={
            <ProtectedRoute>
              <Deudas />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/finanzas/tarjetas-debito" 
          element={
            <ProtectedRoute>
              <TarjetasDebito />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/finanzas/subscripciones" 
          element={
            <ProtectedRoute>
              <Subscripciones />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/finanzas/tarjetas-credito" 
          element={
            <ProtectedRoute>
              <TarjetasCredito />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/finanzas/proyectos" 
          element={
            <ProtectedRoute>
              <Proyectos />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/finanzas/me-deben" 
          element={
            <ProtectedRoute>
              <MeDeben />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/blank-2" 
          element={<AppPage title="" />} 
        />
        <Route 
          path="/blank-3" 
          element={<AppPage title="" />} 
        />
        <Route 
          path="/blank-4" 
          element={<AppPage title="" />} 
        />
        <Route 
          path="/blank-5" 
          element={<AppPage title="" />} 
        />
        <Route 
          path="/blank-6" 
          element={<AppPage title="" />} 
        />
        <Route 
          path="/blank-7" 
          element={<AppPage title="" />} 
        />
        <Route 
          path="/blank-8" 
          element={<AppPage title="" />} 
        />
        <Route 
          path="/blank-9" 
          element={<AppPage title="" />} 
        />
        <Route 
          path="/blank-10" 
          element={<AppPage title="" />} 
        />
        <Route 
          path="/blank-11" 
          element={<AppPage title="" />} 
        />
        <Route 
          path="/blank-12" 
          element={<AppPage title="" />} 
        />
      </Routes>
      {!isLogin && <Footer />}
    </>
  )
}

function App() {
  // Las tasas de cambio ahora se obtienen desde la API en el componente Cuentas

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
