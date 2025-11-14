import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import AppPage from './pages/AppPage'
import Finanzas from './pages/Finanzas'
import Cuentas from './pages/Cuentas'
import Presupuestos from './pages/Presupuestos'
import Transacciones from './pages/Transacciones'
import Deudas from './pages/Deudas'
import StatusBar from './components/StatusBar'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  // Las tasas de cambio ahora se obtienen desde la API en el componente Cuentas

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}

export default App
