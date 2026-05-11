import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import OrdersPage from './pages/OrdersPage'
import InventoryPage from './pages/InventoryPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/"          element={<Dashboard />}     />
            <Route path="/orders"    element={<OrdersPage />}    />
            <Route path="/inventory" element={<InventoryPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
