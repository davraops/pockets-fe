import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Home from './pages/Home'
import Login from './pages/Login'
import AppPage from './pages/AppPage'
import Finanzas from './pages/Finanzas'
import Cuentas from './pages/Cuentas'
import Presupuestos from './pages/Presupuestos'
import DiseñadorPresupuestos from './pages/DiseñadorPresupuestos'
import ListasMercado from './pages/ListasMercado'
import Transacciones from './pages/Transacciones'
import Deudas from './pages/Deudas'
import TarjetasDebito from './pages/TarjetasDebito'
import Subscripciones from './pages/Subscripciones'
import TarjetasCredito from './pages/TarjetasCredito'
import Proyectos from './pages/Proyectos'
import MeDeben from './pages/MeDeben'
import CriptoWallet from './pages/CriptoWallet'
import CriptoTransacciones from './pages/CriptoTransacciones'
import Inflacion from './pages/Inflacion'
import CDTs from './pages/CDTs'
import Registros from './pages/Registros'
import Cuadernos from './pages/Cuadernos'
import Secretos from './pages/Secretos'
import GeneradorContrasenas from './pages/GeneradorContrasenas'
import Calculadora from './pages/Calculadora'
import Archivos from './pages/Archivos'
import Empleados from './pages/Empleados'
import Vehiculos from './pages/Vehiculos'
import Patrimonio from './pages/Patrimonio'
import CryptoVendors from './pages/CryptoVendors'
import Tiempo from './pages/Tiempo'
import Fechas from './pages/Fechas'
import Rutinas from './pages/Rutinas'
import MiDia from './pages/MiDia'
import MiDiario from './pages/MiDiario'
import Notificaciones from './pages/Notificaciones'
import Justicia from './pages/Justicia'
import Procesos from './pages/Procesos'
import Trabajo from './pages/Trabajo'
import Contratos from './pages/Contratos'
import Actividades from './pages/Actividades'
import ProcesosContratacion from './pages/ProcesosContratacion'
import StatusBar from './components/StatusBar'
import ProtectedRoute from './components/ProtectedRoute'
import Footer from './components/Footer'
import { NotificationContainer } from './components/NotificationContainer'

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
      <NotificationContainer />
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
          path="/finanzas/diseñador-presupuestos"
          element={
            <ProtectedRoute>
              <DiseñadorPresupuestos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finanzas/listas-mercado"
          element={
            <ProtectedRoute>
              <ListasMercado />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finanzas/crypto-vendors"
          element={
            <ProtectedRoute>
              <CryptoVendors />
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
          path="/finanzas/cripto-wallet"
          element={
            <ProtectedRoute>
              <CriptoWallet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finanzas/cripto-transacciones"
          element={
            <ProtectedRoute>
              <CriptoTransacciones />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finanzas/inflacion"
          element={
            <ProtectedRoute>
              <Inflacion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finanzas/cdts"
          element={
            <ProtectedRoute>
              <CDTs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registros"
          element={
            <ProtectedRoute>
              <Registros />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registros/cuadernos"
          element={
            <ProtectedRoute>
              <Cuadernos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registros/secretos"
          element={
            <ProtectedRoute>
              <Secretos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registros/generador-contrasenas"
          element={
            <ProtectedRoute>
              <GeneradorContrasenas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registros/calculadora"
          element={
            <ProtectedRoute>
              <Calculadora />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registros/archivos"
          element={
            <ProtectedRoute>
              <Archivos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registros/empleados"
          element={
            <ProtectedRoute>
              <Empleados />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registros/vehiculos"
          element={
            <ProtectedRoute>
              <Vehiculos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/registros/patrimonio"
          element={
            <ProtectedRoute>
              <Patrimonio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tiempo"
          element={
            <ProtectedRoute>
              <Tiempo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tiempo/fechas"
          element={
            <ProtectedRoute>
              <Fechas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tiempo/rutinas"
          element={
            <ProtectedRoute>
              <Rutinas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tiempo/mi-dia"
          element={
            <ProtectedRoute>
              <MiDia />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tiempo/mi-diario"
          element={
            <ProtectedRoute>
              <MiDiario />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notificaciones"
          element={
            <ProtectedRoute>
              <Notificaciones />
            </ProtectedRoute>
          }
        />
        <Route
          path="/justicia"
          element={
            <ProtectedRoute>
              <Justicia />
            </ProtectedRoute>
          }
        />
        <Route
          path="/justicia/procesos"
          element={
            <ProtectedRoute>
              <Procesos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trabajo"
          element={
            <ProtectedRoute>
              <Trabajo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trabajo/contratos"
          element={
            <ProtectedRoute>
              <Contratos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trabajo/actividades"
          element={
            <ProtectedRoute>
              <Actividades />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trabajo/procesos"
          element={
            <ProtectedRoute>
              <ProcesosContratacion />
            </ProtectedRoute>
          }
        />
        <Route path="/blank-2" element={<AppPage title="" />} />
        <Route path="/blank-3" element={<AppPage title="" />} />
        <Route path="/blank-4" element={<AppPage title="" />} />
        <Route path="/blank-5" element={<AppPage title="" />} />
        <Route path="/blank-6" element={<AppPage title="" />} />
        <Route path="/blank-7" element={<AppPage title="" />} />
        <Route path="/blank-8" element={<AppPage title="" />} />
        <Route path="/blank-9" element={<AppPage title="" />} />
        <Route path="/blank-10" element={<AppPage title="" />} />
        <Route path="/blank-11" element={<AppPage title="" />} />
        <Route path="/blank-12" element={<AppPage title="" />} />
      </Routes>
      {!isLogin && <Footer />}
    </>
  )
}

function App() {
  // Las tasas de cambio ahora se obtienen desde la API en el componente Cuentas

  return (
    <ThemeProvider>
      <NotificationProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </NotificationProvider>
    </ThemeProvider>
  )
}

export default App
