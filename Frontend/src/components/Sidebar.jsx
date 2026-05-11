import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🤖</div>
        <div>
          <h1>SmartOps AI</h1>
          <span>Operasyon Asistanı</span>
        </div>
      </div>

      <p className="nav-section-label">Ana Menü</p>

      <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
        <span className="nav-icon">📊</span> Dashboard
      </NavLink>

      <NavLink to="/orders" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
        <span className="nav-icon">📦</span> Siparişler
      </NavLink>

      <NavLink to="/inventory" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
        <span className="nav-icon">🏪</span> Stok Yönetimi
      </NavLink>

      <NavLink to="/emails" className="nav-link">
        <span>✉️</span> Gelen Kutusu
      </NavLink>

      <div className="sidebar-footer">
        <p>Backend durumu</p>
        <span>● Online</span>
      </div>
    </aside>
  )
}
