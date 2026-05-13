import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'

const API = 'http://127.0.0.1:8000'

export default function EmailsPage() {
    const location = useLocation()
    const [emails, setEmails] = useState([])
    const [selectedEmail, setSelectedEmail] = useState(null)
    const [activeTab, setActiveTab] = useState('pending')
    const [replyText, setReplyText] = useState('')
    const [loading, setLoading] = useState(true)
    const [isGeneratingReply, setIsGeneratingReply] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    const getChannel = (sender) => {
        if (!sender) return 'email';
        if (sender.includes('@')) return 'email';
        const digitCount = (sender.match(/\d/g) || []).length;
        return digitCount >= 7 || /^[\d\s\+\-\(\)]+$/.test(sender.trim()) ? 'phone' : 'email';
    }

    useEffect(() => {
        axios.get(`${API}/emails/`)
            .then(res => {
                let fetchedEmails = res.data;
                if (location.state && location.state.itemName) {
                    const { supplierContact, itemName, currentStock } = location.state;
                    
                    const existingEmail = fetchedEmails.find(e => e.sender === supplierContact && e.status === 'replied');
                    
                    if (existingEmail) {
                        setSelectedEmail(existingEmail);
                        setActiveTab('all');
                    } else {
                        const draftText = `Sayın Tedarikçi, sistemimiz ${itemName} stoklarının kritik seviyeye (${currentStock}) düştüğünü tespit etmiştir. Acil stok ikmali için yeni bir sipariş oluşturmak istiyoruz. - SmartOps AI`;
                        const draftEmail = {
                            id: 'draft-' + Date.now(),
                            sender: supplierContact || 'Tedarikçi',
                            subject: `${itemName} Tedariği Hakkında`,
                            body: 'Kritik stok durumu sebebiyle oluşturulan otomatik talep.',
                            ai_suggestion: draftText,
                            status: 'unread'
                        };
                        fetchedEmails = [draftEmail, ...fetchedEmails];
                        setSelectedEmail(draftEmail);
                    }
                }
                setEmails(fetchedEmails);
            })
            .catch(err => console.error("Mailler yüklenemedi", err))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        if (!selectedEmail) return;

        setIsEditing(false);
        if (selectedEmail.ai_suggestion) {
            setReplyText(selectedEmail.ai_suggestion);
        } else {
            setReplyText('');
            setIsGeneratingReply(true);
            axios.post(`${API}/emails/${selectedEmail.id}/generate-reply`)
                .then(res => {
                    const suggestion = typeof res.data === 'string' ? res.data : (res.data.ai_suggestion || res.data.reply || res.data.replyText || 'Yanıt oluşturulamadı.');
                    setReplyText(suggestion);
                    setIsEditing(false);
                })
                .catch(err => {
                    console.error("AI Yanıt hatası:", err);
                    setReplyText('AI şu an meşgul, lütfen yanıtı manuel yazın.');
                })
                .finally(() => setIsGeneratingReply(false));
        }
    }, [selectedEmail]);

    const handleSelectEmail = (email) => {
        setSelectedEmail(email)
        setIsEditing(false)
    }

    const handleSend = async () => {
        if (!selectedEmail) return;
        
        try {
            const repliedDate = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' });

            // Eğer Dashboard'dan gelen sanal bir taslak ise backend'i yormadan gönderildi sayıyoruz
            if (String(selectedEmail.id).startsWith('draft-')) {
                alert('Yanıt başarıyla gönderildi!');
                const updatedEmail = { ...selectedEmail, status: 'replied', repliedAt: repliedDate, sentReply: replyText };
                setEmails(prev => prev.map(e => e.id === selectedEmail.id ? updatedEmail : e));
                setSelectedEmail(updatedEmail);
                return;
            }

            await axios.put(`${API}/emails/${selectedEmail.id}/send`, { replyText });
            
            alert('Yanıt başarıyla gönderildi!');
            const updatedEmail = { ...selectedEmail, status: 'replied', repliedAt: repliedDate };
            setEmails(prev => prev.map(e => e.id === selectedEmail.id ? updatedEmail : e));
            setSelectedEmail(updatedEmail);
        } catch (error) {
            console.error("Gönderme hatası:", error);
            alert('Gönderim sırasında bir sorun oluştu, lütfen tekrar deneyin.');
        }
    }

    if (loading) return <div className="loading-state"><div className="spinner" /></div>

    return (
        <div className="emails-container">
            <div className="page-header">
                <h2>Müşteri & Tedarikçi İletişimi</h2>
                <p>Gelen talepleri AI yardımıyla yanıtlayın.</p>
            </div>

            {/* Sekmeler */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <button
                    onClick={() => setActiveTab('pending')}
                    style={{
                        padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                        border: activeTab === 'pending' ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: activeTab === 'pending' ? 'var(--accent-glow)' : 'var(--bg-card)',
                        color: activeTab === 'pending' ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                >
                    ⏳ Bekleyenler ({emails.filter(e => e.status === 'unread').length})
                </button>
                <button
                    onClick={() => setActiveTab('replied')}
                    style={{
                        padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                        border: activeTab === 'replied' ? '1px solid var(--success)' : '1px solid var(--border)',
                        background: activeTab === 'replied' ? 'rgba(46, 204, 113, 0.1)' : 'var(--bg-card)',
                        color: activeTab === 'replied' ? 'var(--success)' : 'var(--text-secondary)',
                    }}
                >
                    ✅ Cevaplandı ({emails.filter(e => e.status === 'replied').length})
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    style={{
                        padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                        border: activeTab === 'all' ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: activeTab === 'all' ? 'var(--accent-glow)' : 'var(--bg-card)',
                        color: activeTab === 'all' ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                >
                    📁 Hepsi ({emails.length})
                </button>
            </div>

            <div className="emails-layout">
                {/* SOL: Mail Listesi */}
                <div className="emails-list card p-0">
                    {(activeTab === 'pending' ? emails.filter(e => e.status === 'unread') : activeTab === 'replied' ? emails.filter(e => e.status === 'replied') : emails).map(email => {
                        const channel = getChannel(email.sender);
                        return (
                        <div
                            key={email.id}
                            className={`email-item ${selectedEmail?.id === email.id ? 'active' : ''}`}
                            onClick={() => handleSelectEmail(email)}
                        >
                            <div className="email-info">
                                <div className="email-item-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span title={channel === 'email' ? 'E-posta' : 'SMS/WhatsApp'} style={{ fontSize: '14px', color: channel === 'phone' ? 'var(--success)' : 'var(--text-secondary)' }}>
                                            {channel === 'email' ? '✉️' : '📱'}
                                        </span>
                                        <span className="email-sender">{email.sender}</span>
                                        {email.status === 'replied' && (
                                            <span style={{ fontSize: '12px', color: 'var(--success)' }} title="Cevaplandı">✅</span>
                                        )}
                                    </div>
                                    <span className="email-time">14:20</span>
                                </div>
                                <p className="email-subject">{email.subject}</p>
                                <p className="email-preview">{email.body}</p>
                            </div>
                        </div>
                    )})}
                </div>

                {/* SAĞ: Mail Detay */}
                <div className="email-detail card p-0">
                    {selectedEmail ? (
                        <div className="detail-content">
                            <div className="detail-header">
                                <h3>{selectedEmail.subject}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                    <p style={{ margin: 0 }}>Kimden: <strong>{selectedEmail.sender}</strong></p>
                                    {getChannel(selectedEmail.sender) === 'phone' && (
                                        <span style={{ backgroundColor: 'var(--success)', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>SMS/WhatsApp</span>
                                    )}
                                </div>
                            </div>
                            <div className="detail-body">
                                {selectedEmail.body}
                            </div>

                            {/* AI Taslak Bölümü */}
                            <div className="ai-suggestion-box">
                                {selectedEmail.status === 'replied' ? (
                                    <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'var(--bg-hover)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
                                        <p style={{ margin: 0 }}>Bu mesaj <strong>{selectedEmail.repliedAt || 'geçmiş bir tarihte'}</strong> yanıtlanmıştır.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="ai-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>🤖 AI Yanıt Taslağı</span>
                                            {isGeneratingReply && <span style={{ fontSize: '13px', color: 'var(--accent)' }}>⏳ AI yanıtı hazırlanıyor...</span>}
                                        </div>
                                        <textarea 
                                            className={`ai-textarea ${isGeneratingReply ? 'pulse' : ''}`}
                                            value={isGeneratingReply ? 'AI verileri analiz ediyor ve yanıt taslağı hazırlıyor...' : replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Yanıtınızı buraya yazın..."
                                            readOnly={!isEditing}
                                            style={{ 
                                                opacity: isGeneratingReply ? 0.7 : 1, 
                                                transition: 'all 0.3s',
                                                border: isEditing ? '1px solid #4a90e2' : '1px solid var(--border)',
                                                boxShadow: isEditing ? '0 0 8px rgba(74, 144, 226, 0.4)' : 'none',
                                                backgroundColor: isEditing ? 'var(--bg-card)' : 'var(--bg-hover)',
                                                outline: 'none'
                                            }}
                                            disabled={isGeneratingReply}
                                        />
                                        <div className="ai-actions">
                                            <button 
                                                className="btn-send" 
                                                onClick={handleSend}
                                                style={getChannel(selectedEmail.sender) === 'phone' ? { backgroundColor: 'var(--success)', borderColor: 'var(--success)', boxShadow: '0 4px 12px rgba(46, 204, 113, 0.2)' } : {}}
                                            >
                                                {getChannel(selectedEmail.sender) === 'phone' ? 'Onayla ve WhatsApp/SMS Gönder' : 'Onayla ve E-posta Gönder'}
                                            </button>
                                            <button 
                                                className="btn-small"
                                                onClick={() => setIsEditing(!isEditing)}
                                            >
                                                {isEditing ? 'Düzenlemeyi Bitir' : 'Taslağı Düzenle'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>✉️</div>
                            <p style={{ fontSize: '15px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.6' }}>
                                İşlem yapmak için bir mesaj seçin veya Dashboard üzerinden aksiyon alın.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}