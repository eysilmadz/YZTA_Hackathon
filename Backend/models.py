from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class Order(Base):
    """
    Siparişler tablosu.
    """
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_email = Column(String(255), nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    status = Column(
        String(50),
        nullable=False,
        default="hazırlanıyor"
        # hazırlanıyor | kargoya verildi | teslim edildi | iptal edildi
    )
    tracking_code = Column(String(100), nullable=True)
    estimated_delivery = Column(String(20), nullable=True)   # "YYYY-MM-DD" formatında
    order_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "customer_email": self.customer_email,
            "product_name": self.product_name,
            "status": self.status,
            "tracking_code": self.tracking_code,
            "estimated_delivery": self.estimated_delivery,
            "order_date": self.order_date.isoformat() if self.order_date else None,
        }


class Inventory(Base):
    """
    Stok tablosu.
    AI, stock_quantity < critical_level olduğunda otomatik uyarı üretir.
    """
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    item_name = Column(String(255), nullable=False, unique=True)
    stock_quantity = Column(Integer, nullable=False, default=0)
    critical_level = Column(Integer, nullable=False, default=10)
    supplier_contact = Column(String(255), nullable=True)   # e-posta veya telefon

    def to_dict(self):
        return {
            "id": self.id,
            "item_name": self.item_name,
            "stock_quantity": self.stock_quantity,
            "critical_level": self.critical_level,
            "supplier_contact": self.supplier_contact,
            "is_critical": self.stock_quantity < self.critical_level,
        }


class AILog(Base):
    """
    AI işlem günlüğü.
    Hangi aksiyonun ne zaman, ne içerikle tetiklendiğini kaydeder.
    """
    __tablename__ = "ai_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    action_type = Column(String(100), nullable=False)
    # "Mail Özetleme" | "Stok Uyarısı" | "Sipariş Sorgulama" | "Taslak Yanıt"
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "action_type": self.action_type,
            "content": self.content,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }

class Email(Base):
    """
    Gelen ve gönderilen mailleri tutar.
    """
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sender = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String(50), default="unread") # unread | read | replied
    ai_suggestion = Column(Text, nullable=True)   # AI'nın hazırladığı taslak yanıt
    received_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "sender": self.sender,
            "subject": self.subject,
            "body": self.body,
            "status": self.status,
            "ai_suggestion": self.ai_suggestion,
            "received_at": self.received_at.isoformat()
        }