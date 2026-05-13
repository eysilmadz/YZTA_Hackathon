import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq  # Buranın ChatGroq olduğundan emin ol
from langchain_core.prompts import ChatPromptTemplate
from sqlalchemy.orm import Session
from models import Order, Email

load_dotenv()

# Groq API anahtarını kullanıyoruz
llm = ChatGroq(
    temperature=0.7,
    model_name="llama-3.1-8b-instant",  # Listendeki hızlı model
    groq_api_key=os.getenv("GROQ_API_KEY")
)


def generate_ai_reply(db: Session, email_id: int):
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        return "Hata: Mail kaydı bulunamadı."

    order = db.query(Order).filter(Order.customer_email == email.sender).first()

    order_info = (f"Ürün: {order.product_name}, Durum: {order.status}, "
                  f"Kargo: {order.tracking_code or 'Yok'}") if order else "Sipariş bulunamadı."

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Sen nazik bir müşteri temsilcisisin. Yanıtlarını Türkçe ve çözüm odaklı yaz."),
        ("user", f"Müşteri Mesajı: {email.body}\nSistem Verisi: {order_info}")
    ])

    chain = prompt | llm
    try:
        response = chain.invoke({})
        return response.content
    except Exception as e:
        return f"Sistem şu an yanıt veremiyor. (Hata: {str(e)[:50]})"