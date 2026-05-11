import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://127.0.0.1:8000'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

const STATUS_MAP = {
  'hazırlanıyor':    { label: 'Hazırlanıyor',    cls: 'badge-warning', icon: '⏳' },
  'kargoya verildi': { label: 'Kargoya Verildi',  cls: 'badge-info',    icon: '🚚' },
  'teslim edildi':   { label: 'Teslim Edildi',    cls: 'badge-success', icon: '✅' },
  'iptal edildi':    { label: 'İptal Edildi',     cls: 'badge-danger',  icon: '❌' },
}

export default function OrdersPage() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

  useEffect(() => {
    axios.get(`${API}/orders/`)
      .then(r => setOrders(r.data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter)

  const counts = {
    all:               orders.length,
    'hazırlanıyor':    orders.filter(o => o.status === 'hazırlanıyor').length,
    'kargoya verildi': orders.filter(o => o.status === 'kargoya verildi').length,
    'teslim edildi':   orders.filter(o => o.status === 'teslim edildi').length,
    'iptal edildi':    orders.filter(o => o.status === 'iptal edildi').length,
  }

  return (
    <div>
      <div className="page-header">
        <h2>📦 Siparişler</h2>
        <p>Tüm müşteri siparişlerini buradan takip edebilirsiniz</p>
      </div>

      {/* Filtre Sekmeleri */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'all',               label: `Tümü (${counts.all})` },
          { key: 'hazırlanıyor',      label: `⏳ Hazırlanıyor (${counts['hazırlanıyor']})` },
          { key: 'kargoya verildi',   label: `🚚 Kargoda (${counts['kargoya verildi']})` },
          { key: 'teslim edildi',     label: `✅ Teslim (${counts['teslim edildi']})` },
          { key: 'iptal edildi',      label: `❌ İptal (${counts['iptal edildi']})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: filter === tab.key ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: filter === tab.key ? 'var(--accent-glow)' : 'var(--bg-card)',
              color: filter === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
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
                  <th>Müşteri</th>
                  <th>Ürün</th>
                  <th>Durum</th>
                  <th>Takip Kodu</th>
                  <th>Tahmini Teslimat</th>
                  <th>Sipariş Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <span className="empty-icon">📭</span>
                        <p>Bu kategoride sipariş yok</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(order => {
                  const s = STATUS_MAP[order.status] || { label: order.status, cls: 'badge-muted', icon: '?' }
                  return (
                    <tr key={order.id}>
                      <td className="td-secondary">#{order.id}</td>
                      <td>{order.customer_email}</td>
                      <td style={{ fontWeight: 500 }}>{order.product_name}</td>
                      <td>
                        <span className={`badge ${s.cls}`}>
                          {s.icon} {s.label}
                        </span>
                      </td>
                      <td>
                        {order.tracking_code
                          ? <span className="tracking-code">{order.tracking_code}</span>
                          : <span className="td-secondary">—</span>
                        }
                      </td>
                      <td className="td-secondary">{order.estimated_delivery || '—'}</td>
                      <td className="td-secondary">{formatDate(order.order_date)}</td>
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
