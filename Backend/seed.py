"""
seed.py - Veritabanini demo verileriyle doldurur.
Calistirmak icin: python seed.py
(Uygulama calistirilmadan once bir kez calistirilmasi yeterlidir.)
"""

import sys
sys.stdout.reconfigure(encoding="utf-8")

from database import SessionLocal, create_tables
from models import Order, Inventory, AILog, Email
from datetime import datetime, timedelta

# --------------------------------------------------------------------------- #
# Yardımcı fonksiyon
# --------------------------------------------------------------------------- #

def clear_and_seed():
    create_tables()          # Tablolar yoksa oluştur
    db = SessionLocal()

    try:
        # Mevcut verileri temizle (her çalıştırmada temiz başla)
        db.query(AILog).delete()
        db.query(Order).delete()
        db.query(Inventory).delete()
        db.commit()

        # ------------------------------------------------------------------- #
        # 1) SİPARİŞLER
        # ------------------------------------------------------------------- #
        today = datetime.now()

        orders = [
            Order(
                customer_email="ahmet.yilmaz@gmail.com",
                product_name="Domates (5 kg)",
                status="hazırlanıyor",
                tracking_code=None,
                estimated_delivery=(today + timedelta(days=1)).strftime("%Y-%m-%d"),
                order_date=today - timedelta(hours=3),
            ),
            Order(
                customer_email="fatma.kaya@hotmail.com",
                product_name="Zeytinyağı (1 lt)",
                status="hazırlanıyor",
                tracking_code=None,
                estimated_delivery=(today + timedelta(days=1)).strftime("%Y-%m-%d"),
                order_date=today - timedelta(hours=5),
            ),
            Order(
                customer_email="mehmet.demir@outlook.com",
                product_name="Baklava (1 kg)",
                status="hazırlanıyor",
                tracking_code=None,
                estimated_delivery=(today + timedelta(days=2)).strftime("%Y-%m-%d"),
                order_date=today - timedelta(hours=7),
            ),
            Order(
                customer_email="ayse.celik@gmail.com",
                product_name="Peynir Çeşitleri (500 g)",
                status="kargoya verildi",
                tracking_code="MN345678",
                estimated_delivery=(today + timedelta(days=1)).strftime("%Y-%m-%d"),
                order_date=today - timedelta(days=1),
            ),
            Order(
                customer_email="hasan.oz@gmail.com",
                product_name="Fıstık Ezmesi (350 g)",
                status="kargoya verildi",
                tracking_code="MN349921",
                estimated_delivery=today.strftime("%Y-%m-%d"),
                order_date=today - timedelta(days=2),
            ),
            Order(
                customer_email="zeynep.arslan@yandex.com",
                product_name="Organik Bal (500 g)",
                status="teslim edildi",
                tracking_code="MN298765",
                estimated_delivery=(today - timedelta(days=1)).strftime("%Y-%m-%d"),
                order_date=today - timedelta(days=4),
            ),
            Order(
                customer_email="emre.sahin@gmail.com",
                product_name="Kuru İncir (250 g)",
                status="teslim edildi",
                tracking_code="MN287654",
                estimated_delivery=(today - timedelta(days=2)).strftime("%Y-%m-%d"),
                order_date=today - timedelta(days=5),
            ),
            Order(
                customer_email="selin.yurt@gmail.com",
                product_name="Mercimek (1 kg)",
                status="iptal edildi",
                tracking_code=None,
                estimated_delivery=None,
                order_date=today - timedelta(days=3),
            ),
        ]

        db.add_all(orders)

        # ------------------------------------------------------------------- #
        # 2) STOK
        # ------------------------------------------------------------------- #
        inventory = [
            # Kritik seviyenin ALTINDA olanlar (AI uyarı üretecek)
            Inventory(
                item_name="Domates",
                stock_quantity=4,          # critical_level=10
                critical_level=10,
                supplier_contact="tedarik@tazesebze.com",
            ),
            Inventory(
                item_name="Zeytinyağı",
                stock_quantity=3,          # critical_level=5
                critical_level=5,
                supplier_contact="siparis@egeyag.com.tr",
            ),
            Inventory(
                item_name="Organik Bal",
                stock_quantity=2,          # critical_level=8
                critical_level=8,
                supplier_contact="0532 111 22 33",
            ),
            # Normal seviyede olanlar
            Inventory(
                item_name="Baklava",
                stock_quantity=25,
                critical_level=5,
                supplier_contact="baklava@tatlidunyasi.com",
            ),
            Inventory(
                item_name="Peynir Çeşitleri",
                stock_quantity=18,
                critical_level=10,
                supplier_contact="siparis@sutselpazari.com",
            ),
            Inventory(
                item_name="Fıstık Ezmesi",
                stock_quantity=12,
                critical_level=5,
                supplier_contact="info@dogaltatlar.com",
            ),
            Inventory(
                item_name="Kuru İncir",
                stock_quantity=30,
                critical_level=10,
                supplier_contact="ihracat@egeincir.com",
            ),
            Inventory(
                item_name="Mercimek",
                stock_quantity=50,
                critical_level=15,
                supplier_contact="0216 444 55 66",
            ),
        ]

        db.add_all(inventory)

        # ------------------------------------------------------------------- #
        # 3) AI GÜNLÜĞÜ (geçmiş aksiyon örnekleri)
        # ------------------------------------------------------------------- #
        ai_logs = [
            AILog(
                action_type="Stok Uyarısı",
                content="Domates stoğu kritik seviyenin altına düştü (4 adet kaldı, eşik: 10). Tedarikçi: tedarik@tazesebze.com",
                timestamp=today - timedelta(hours=2),
            ),
            AILog(
                action_type="Stok Uyarısı",
                content="Zeytinyağı stoğu kritik seviyenin altına düştü (3 adet kaldı, eşik: 5). Tedarikçi: siparis@egeyag.com.tr",
                timestamp=today - timedelta(hours=2),
            ),
            AILog(
                action_type="Sipariş Sorgulama",
                content="Müşteri ahmet.yilmaz@gmail.com sipariş durumu sorgulandı. Durum: hazırlanıyor. Kargo etiketi henüz oluşturulmadı.",
                timestamp=today - timedelta(hours=1),
            ),
            AILog(
                action_type="Mail Özetleme",
                content="Gelen kutusu tarandı. 3 yeni müşteri maili tespit edildi: 2 sipariş sorgulama, 1 şikayet.",
                timestamp=today - timedelta(minutes=30),
            ),
        ]
        db.add_all(ai_logs)

        emails = [
            Email(
                sender="ahmet.yilmaz@gmail.com",
                subject="Siparişim nerede?",
                body="Merhaba, dün verdiğim domates siparişi hala hazırlanıyor görünüyor. Ne zaman gelir?",
            ),
            Email(
                sender="bilgi@tedarik.com",
                subject="Fiyat Güncellemesi",
                body="Önümüzdeki aydan itibaren zeytinyağı fiyatlarında %10 artış olacaktır.",
            )
        ]
        db.add_all(emails)

        db.commit()

        # Sonuç raporu
        print("=" * 50)
        print("[OK] Seed verisi basariyla yuklendi!")
        print(f"   Siparisler : {len(orders)} kayit")
        print(f"   Stok       : {len(inventory)} kalem")
        print(f"   AI Gunlugu : {len(ai_logs)} kayit")
        critical_count = sum(1 for i in inventory if i.stock_quantity < i.critical_level)
        print(f"   Kritik Stok: {critical_count} urun alarm veriyor")
        pending_count = sum(1 for o in orders if o.status == "hazirlanıyor")
        print(f"   Bekleyen   : {pending_count} siparis bugun gonderilmeli")
        print("=" * 50)

    except Exception as e:
        db.rollback()
        print(f"[HATA] {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    clear_and_seed()
