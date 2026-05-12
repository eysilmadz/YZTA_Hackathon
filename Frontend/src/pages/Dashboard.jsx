import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://127.0.0.1:8000'

/* ─── Helpers ─────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

function StatCard({ label, value, sub, variant }) {
  return (
    <div className={`stat-card ${variant || ''}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  )
}

function StockBar({ quantity, level }) {
  const pct = Math.min(100, Math.round((quantity / (level * 2)) * 100))
  const cls = quantity < level ? 'danger' : quantity < level * 1.5 ? 'warning' : 'safe'
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${pct}%` }} data-cls={cls} />
    </div>
  )
}

/* ─── Dashboard Page ──────────────────────────────────────── */
export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [runningChecks, setRunningChecks] = useState(false)

  const fetchSummary = () => {
    setLoading(true)
    axios.get(`${API}/dashboard/summary`)
      .then(r => setSummary(r.data))
      .catch(() => setError('Backend\'e bağlanılamadı. Sunucunun çalıştığından emin olun.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const runDailyChecks = async () => {
    setRunningChecks(true)
    try {
      await axios.post(`${API}/dashboard/run-daily-checks`)
      fetchSummary()
    } catch (err) {
      alert("Günlük kontroller çalıştırılamadı!")
    } finally {
      setRunningChecks(false)
    }
  }

  if (loading && !summary) return (
    <div className="loading-state">
      <div className="spinner" />
      <p>Veriler yükleniyor…</p>
    </div>
  )

  if (error) return (
    <div className="empty-state">
      <span className="empty-icon">⚠️</span>
      <p>{error}</p>
    </div>
  )

  const { briefing, date, orders, inventory, recent_ai_actions } = summary

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Dashboard</h2>
          <p>Operasyonunuzun anlık görünümü</p>
        </div>
        <button
          onClick={runDailyChecks}
          disabled={runningChecks}
          className="btn-send"
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          {runningChecks ? 'Kontrol Ediliyor...' : 'Günlük Kontrolleri Yap'}
        </button>
      </div>

      {/* Briefing Banner */}
      <div className="briefing-banner">
        <span className="briefing-icon">🤖</span>
        <div className="briefing-text">
          <h3>Günlük Asistan Özeti</h3>
          <p>{briefing}</p>
          <p className="briefing-date">{formatDate(date + 'T00:00:00')}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard label="Toplam Sipariş" value={orders.total} sub="tüm zamanlar" variant="info" />
        <StatCard label="Kargo Bekliyor" value={orders.pending} sub="bugün gönderilmeli" variant={orders.pending > 0 ? 'warning' : 'success'} />
        <StatCard label="Kargoya Verildi" value={orders.shipped} sub="yolda" variant="info" />
        <StatCard label="Teslim Edildi" value={orders.delivered} sub="tamamlandı" variant="success" />
        <StatCard label="Kritik Stok" value={inventory.critical_count} sub="acil tedarik gerekli" variant={inventory.critical_count > 0 ? 'danger' : 'success'} />
      </div>

      <div className="three-col">
        {/* Kritik Stok Uyarıları */}
        <div className="card">
          <div className="section-header">
            <h3>🔴 Kritik Stok Uyarıları</h3>
            <p>{inventory.critical_count} ürün</p>
          </div>

          {inventory.critical_count === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <span className="empty-icon">✅</span>
              <p>Tüm stoklar yeterli seviyede</p>
            </div>
          ) : (
            <div className="alert-list">
              {inventory.critical_items.map(item => (
                <div key={item.id} className="alert-item critical">
                  <div className="alert-item-left">
                    <span className="alert-dot red pulse" />
                    <div>
                      <p className="alert-name">{item.item_name}</p>
                      <p className="alert-contact">{item.supplier_contact}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="alert-stock">{item.stock_quantity} / {item.critical_level}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>mevcut / eşik</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Log */}
        <div className="card">
          <div className="section-header">
            <h3>🤖 Son Asistan Aksiyonları</h3>
          </div>
          <div className="alert-list">
            {recent_ai_actions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Henüz aksiyon yok</p>
            ) : (
              recent_ai_actions.map(log => (
                <div key={log.id} className="alert-item">
                  <div className="alert-item-left">
                    <span className="alert-dot yellow" />
                    <div>
                      <p className="alert-name" style={{ fontSize: '13px' }}>{log.action_type}</p>
                      <p className="alert-contact" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
