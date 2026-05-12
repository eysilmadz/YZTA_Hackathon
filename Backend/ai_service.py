# 1. Gelen mailin gönderen adresini al.
# 2. Orders tablosunda bu adrese ait sipariş var mı bak.
# 3. Eğer varsa durumu (hazırlanıyor, kargoda vb.) al.
# 4. OpenAI'ya şu promptu gönder: "Müşteri maili: [BODY], Sipariş Durumu: [STATUS].
#    Lütfen nazik bir yanıt taslağı hazırla."

import os
from dotenv import load_dotenv
# Langchain'in en güncel ve en kararlı import yolunu kullanalım
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from sqlalchemy.orm import Session
from models import Order, Email

load_dotenv()

# 'gemini-pro' en kararlı modeldir ve 404 hatası verme ihtimali en düşüktür.
llm = ChatGoogleGenerativeAI(
    model="gemini-pro",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.7,
    # Güvenlik ayarlarını bazen çok sıkı tutabiliyor, şimdilik esnetelim
    safety_settings={}
)


def generate_ai_reply(db: Session, email_id: int):
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        return "Hata: Mail kaydı bulunamadı."

    order = db.query(Order).filter(Order.customer_email == email.sender).first()

    if order:
        order_info = f"Ürün: {order.product_name}, Durum: {order.status}, Takip: {order.tracking_code}"
    else:
        order_info = "Sipariş bulunamadı."

    # Çok basit bir prompt yapısı deneyelim (Hata payını azaltmak için)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Sen bir müşteri temsilcisisin. Nazikçe Türkçe cevap taslağı yaz."),
        ("user", f"Müşteri ne sordu: {email.body}\nSipariş durumu ne: {order_info}")
    ])

    chain = prompt | llm
    try:
        # invoke yerine bazen basit string bekleyebilir, en güvenli yol:
        response = llm.invoke(prompt.format(body=email.body, order_info=order_info))
        return response.content
    except Exception as e:
        # Eğer hala hata alırsan, hatanın ne olduğunu tam görmek için:
        print(f"DETAYLI HATA: {e}")
        return f"AI şu an meşgul, lütfen biraz sonra tekrar dene. (Hata: {str(e)[:50]})"