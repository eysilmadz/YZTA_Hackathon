from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Inventory

router = APIRouter(prefix="/inventory", tags=["Stok"])


@router.get("/")
def list_inventory(db: Session = Depends(get_db)):
    """Tüm stok kalemlerini döndürür."""
    items = db.query(Inventory).order_by(Inventory.item_name).all()
    return [i.to_dict() for i in items]


@router.get("/alerts")
def get_critical_alerts(db: Session = Depends(get_db)):
    """
    Kritik seviyenin altına düşen stok kalemlerini döndürür.
    AI, sabah briefing'inde bu endpoint'ten uyarıları üretir.
    stock_quantity < critical_level koşulunu Python tarafında filtreler
    (SQLite'da alan karşılaştırması için ORM kullanımı).
    """
    all_items = db.query(Inventory).all()
    critical_items = [i for i in all_items if i.stock_quantity < i.critical_level]

    return {
        "alert_count": len(critical_items),
        "alerts": [
            {
                **i.to_dict(),
                "shortage": i.critical_level - i.stock_quantity,   # kaç adet eksik
            }
            for i in critical_items
        ],
    }


@router.get("/{item_id}")
def get_inventory_item(item_id: int, db: Session = Depends(get_db)):
    """Tek bir stok kaleminin detayını döndürür."""
    item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Stok kalemi bulunamadı.")
    return item.to_dict()
