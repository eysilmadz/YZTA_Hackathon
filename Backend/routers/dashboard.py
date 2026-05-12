from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Order, Inventory, AILog
from datetime import datetime, date

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Ana Dashboard için tek sorguda özet veri döndürür.
    """

    # --- Sipariş istatistikleri ---
    all_orders = db.query(Order).all()
    pending_orders   = [o for o in all_orders if o.status == "hazırlanıyor"]
    shipped_orders   = [o for o in all_orders if o.status == "kargoya verildi"]
    delivered_orders = [o for o in all_orders if o.status == "teslim edildi"]
    cancelled_orders = [o for o in all_orders if o.status == "iptal edildi"]

    # --- Stok istatistikleri ---
    all_inventory = db.query(Inventory).all()
    critical_items = [i for i in all_inventory if i.stock_quantity < i.critical_level]

    # --- AI Log istatistikleri (son 24 saat) ---
    recent_logs = (
        db.query(AILog)
        .order_by(AILog.timestamp.desc())
        .limit(5)
        .all()
    )

    # --- Otomatik briefing metni ---
    briefing_parts = []
    if pending_orders:
        briefing_parts.append(
            f"{len(pending_orders)} sipariş kargo için hazır bekliyor"
        )
    if critical_items:
        names = ", ".join(i.item_name for i in critical_items[:3])
        briefing_parts.append(
            f"{len(critical_items)} üründe kritik stok uyarısı var ({names})"
        )
    if not briefing_parts:
        briefing_text = "Her şey yolunda! Bekleyen kritik aksiyon yok."
    else:
        briefing_text = " • ".join(briefing_parts) + "."

    return {
        "date": date.today().isoformat(),
        "briefing": briefing_text,
        "orders": {
            "total": len(all_orders),
            "pending": len(pending_orders),
            "shipped": len(shipped_orders),
            "delivered": len(delivered_orders),
            "cancelled": len(cancelled_orders),
        },
        "inventory": {
            "total_items": len(all_inventory),
            "critical_count": len(critical_items),
            "critical_items": [
                {
                    "id": i.id,
                    "item_name": i.item_name,
                    "stock_quantity": i.stock_quantity,
                    "critical_level": i.critical_level,
                    "supplier_contact": i.supplier_contact,
                }
                for i in critical_items
            ],
        },
        "recent_ai_actions": [log.to_dict() for log in recent_logs],
    }

@router.post("/run-daily-checks")
def run_daily_checks(db: Session = Depends(get_db)):
    """
    Kritik stokları ve kargo bekleyen siparişleri bulur, AI log tablosuna uyarı kaydı atar.
    """
    
    # 1. Bekleyen sipariş kontrolü
    pending_orders = db.query(Order).filter(Order.status == "hazırlanıyor").all()
    if pending_orders:
        log_content = f"Bugün {len(pending_orders)} adet paket gönderilmeli."
        db.add(AILog(action_type="Sipariş Uyarısı", content=log_content))
        
    # 2. Stok seviyesi kontrolü
    all_inventory = db.query(Inventory).all()
    for item in all_inventory:
        if item.stock_quantity < item.critical_level:
            log_content = f"Acil: {item.item_name} stoğu bitiyor! (Kalan: {item.stock_quantity}, Eşik: {item.critical_level})"
            db.add(AILog(action_type="Stok Uyarısı", content=log_content))
            
    db.commit()
    
    return {"status": "success", "message": "Günlük kontroller tamamlandı ve loglandı."}
