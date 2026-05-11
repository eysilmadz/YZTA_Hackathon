from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Order

router = APIRouter(prefix="/orders", tags=["Siparişler"])


@router.get("/")
def list_orders(db: Session = Depends(get_db)):
    """Tüm siparişleri döndürür."""
    orders = db.query(Order).order_by(Order.order_date.desc()).all()
    return [o.to_dict() for o in orders]


@router.get("/pending")
def list_pending_orders(db: Session = Depends(get_db)):
    """
    Bugün gönderilmesi gereken siparişleri döndürür.
    status = 'hazırlanıyor' olanlar, yani kargo etiketi bekleyenler.
    """
    pending = (
        db.query(Order)
        .filter(Order.status == "hazırlanıyor")
        .order_by(Order.order_date.asc())
        .all()
    )
    return {
        "count": len(pending),
        "orders": [o.to_dict() for o in pending],
    }


@router.get("/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Tek bir siparişin detayını döndürür."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı.")
    return order.to_dict()


@router.get("/customer/{email}")
def get_orders_by_customer(email: str, db: Session = Depends(get_db)):
    """
    Belirli bir müşteriye ait tüm siparişleri döndürür.
    AI, 'Siparişim nerede?' maillerini yanıtlarken bu endpoint'i kullanır.
    """
    orders = (
        db.query(Order)
        .filter(Order.customer_email == email)
        .order_by(Order.order_date.desc())
        .all()
    )
    if not orders:
        raise HTTPException(
            status_code=404,
            detail=f"{email} adresine ait sipariş bulunamadı.",
        )
    return [o.to_dict() for o in orders]
