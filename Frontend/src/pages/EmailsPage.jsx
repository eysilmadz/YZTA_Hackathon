import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://127.0.0.1:8000'

export default function EmailsPage() {
    const [emails, setEmails] = useState([])
    const [selectedEmail, setSelectedEmail] = useState(null)
    const [replyText, setReplyText] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        axios.get(`${API}/emails/`)
            .then(res => setEmails(res.data))
            .catch(err => console.error("Mailler yüklenemedi", err))
            .finally(() => setLoading(false))
    }, [])

    const handleSelectEmail = (email) => {
        setSelectedEmail(email)
        setReplyText(email.ai_suggestion || '')
    }

    if (loading) return <div className="loading-state"><div className="spinner" /></div>

    return (
        <div className="emails-container">
            <div className="page-header">
                <h2>Müşteri İletişimi</h2>
                <p>Gelen talepleri AI yardımıyla yanıtlayın.</p>
            </div>

            <div className="emails-layout">
                {/* SOL: Mail Listesi */}
                <div className="emails-list card p-0">
                    {emails.map(email => (
                        <div
                            key={email.id}
                            className={`email-item ${selectedEmail?.id === email.id ? 'active' : ''}`}
                            onClick={() => handleSelectEmail(email)}
                        >
                            <div className="email-info">
                                <div className="email-item-header">
                                    <span className="email-sender">{email.sender}</span>
                                    <span className="email-time">14:20</span>
                                </div>
                                <p className="email-subject">{email.subject}</p>
                                <p className="email-preview">{email.body}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* SAĞ: Mail Detay */}
                <div className="email-detail card p-0">
                    {selectedEmail ? (
                        <div className="detail-content">
                            <div className="detail-header">
                                <h3>{selectedEmail.subject}</h3>
                                <p>Kimden: <strong>{selectedEmail.sender}</strong></p>
                            </div>
                            <div className="detail-body">
                                {selectedEmail.body}
                            </div>

                            {/* AI Taslak Bölümü */}
                            <div className="ai-suggestion-box">
                                <div className="ai-header">
                                    <span>🤖 AI Yanıt Taslağı</span>
                                </div>
                                <textarea 
                                    className="ai-textarea"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Yanıtınızı buraya yazın..."
                                />
                                <div className="ai-actions">
                                    <button className="btn-send">Onayla ve Gönder</button>
                                    <button className="btn-small">Taslağı Düzenle</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>Okumak için bir mesaj seçin</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}