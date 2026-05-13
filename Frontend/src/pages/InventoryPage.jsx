import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://127.0.0.1:8000'

function StockBar({ quantity, level }) {
  // Yüzde: stok, eşiğin 2 katı olduğunda %100 kabul edilir
  const pct = Math.min(100, Math.round((quantity / Math.max(level * 2, 1)) * 100))
  const cls = quantity < level
    ? 'danger'
    : quantity < level * 1.5
    ? 'warning'
    : 'safe'
  return (
    <div style={{ minWidth: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{quantity}</span>
        <span style={{ color: 'var(--text-muted)' }}>/ eşik {level}</span>
      </div>
      <div className="progress-bar">
        <div
          className={`progress-fill ${cls}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const navigate = useNavigate()
  const [items, setItems]     = useState([])
  const [alerts, setAlerts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showOnly, setShowOnly] = useState('all')  // 'all' | 'critical'

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/inventory/`),
      axios.get(`${API}/inventory/alerts`),
    ]).then(([itemsRes, alertsRes]) => {
      setItems(itemsRes.data)
      setAlerts(alertsRes.data.alerts)
    }).finally(() => setLoading(false))
  }, [])

  const displayed = showOnly === 'critical'
    ? items.filter(i => i.is_critical)
    : items

  const criticalCount = alerts.length

  return (
    <div>
      <div className="page-header">
        <h2>🏪 Stok Yönetimi</h2>
        <p>Ürün stoklarını takip edin, kritik seviyeleri yönetin</p>
      </div>

      {/* Özet Kartlar */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className={`stat-card ${criticalCount > 0 ? 'danger' : 'success'}`}>
          <p className="stat-label">Kritik Stok</p>
          <p className="stat-value">{criticalCount}</p>
          <p className="stat-sub">acil tedarik gerekli</p>
        </div>
        <div className="stat-card info">
          <p className="stat-label">Toplam Ürün</p>
          <p className="stat-value">{items.length}</p>
          <p className="stat-sub">stokta takip edilen</p>
        </div>
        <div className="stat-card success">
          <p className="stat-label">Yeterli Stok</p>
          <p className="stat-value">{items.length - criticalCount}</p>
          <p className="stat-sub">sorunsuz kalemler</p>
        </div>
      </div>

      {/* Filtre */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { key: 'all',      label: `Tüm Ürünler (${items.length})` },
          { key: 'critical', label: `🔴 Sadece Kritikler (${criticalCount})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setShowOnly(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: showOnly === tab.key ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: showOnly === tab.key ? 'var(--accent-glow)' : 'var(--bg-card)',
              color: showOnly === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tablo */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Yükleniyor…</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Ürün Adı</th>
                  <th>Stok Seviyesi</th>
                  <th>Durum</th>
                  <th>Eksik Adet</th>
                  <th>Tedarikçi</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <span className="empty-icon">✅</span>
                        <p>Kritik stok uyarısı bulunmuyor</p>
                      </div>
                    </td>
                  </tr>
                ) : displayed.map(item => {
                  const shortage = item.critical_level - item.stock_quantity
                  return (
                    <tr key={item.id} style={item.is_critical ? { background: 'rgba(248,81,73,0.04)' } : {}}>
                      <td className="td-secondary">#{item.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {item.is_critical && (
                            <span className="alert-dot red pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--danger)', boxShadow: '0 0 6px var(--danger)', flexShrink: 0 }} />
                          )}
                          <span style={{ fontWeight: 500 }}>{item.item_name}</span>
                        </div>
                      </td>
                      <td style={{ minWidth: 160 }}>
                        <StockBar quantity={item.stock_quantity} level={item.critical_level} />
                      </td>
                      <td>
                        {item.is_critical
                          ? <span className="badge badge-danger">🔴 Kritik</span>
                          : item.stock_quantity < item.critical_level * 1.5
                          ? <span className="badge badge-warning">⚠️ Dikkat</span>
                          : <span className="badge badge-success">✅ Yeterli</span>
                        }
                      </td>
                      <td>
                        {shortage > 0
                          ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>−{shortage} adet</span>
                          : <span className="td-secondary">—</span>
                        }
                      </td>
                      <td className="td-secondary">{item.supplier_contact || '—'}</td>
                      <td>
                        {item.stock_quantity < item.critical_level && (
                            <button
                                title="Tedarikçiye Yaz"
                                onClick={() => navigate('/emails', {
                                    state: {
                                        supplierContact: item.supplier_contact,
                                        itemName: item.item_name,
                                        currentStock: item.stock_quantity
                                    }
                                })}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', transition: 'transform 0.2s' }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                ✉️
                            </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
