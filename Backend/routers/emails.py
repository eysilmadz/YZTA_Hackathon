from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Email, AILog
from ai_service import generate_ai_reply

router = APIRouter(prefix="/emails", tags=["Emails"])


@router.get("/")
def list_emails(db: Session = Depends(get_db)):
    emails = db.query(Email).order_by(Email.received_at.desc()).all()
    return [e.to_dict() for e in emails]


@router.get("/{email_id}")
def get_email(email_id: int, db: Session = Depends(get_db)):
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    return email.to_dict()


@router.post("/{email_id}/generate-reply")
def create_ai_suggestion(email_id: int, db: Session = Depends(get_db)):
    # 1. Veritabanında maili kontrol et
    email = db.query(Email).filter(Email.id == email_id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    # 2. Gemini AI Yanıtını Üret (ai_service.py çağrılır)
    suggestion = generate_ai_reply(db, email_id)

    # 3. Email kaydını AI taslağı ile güncelle
    email.ai_suggestion = suggestion

    # 4. Arkadaşının sistemiyle uyumlu AI Log kaydı oluştur
    new_log = AILog(
        action_type="Taslak Yanıt",
        content=f"{email.sender} için '{email.subject}' konulu mailine AI yanıt taslağı oluşturuldu."
    )

    db.add(new_log)
    db.commit()
    db.refresh(email)  # Güncel veriyi yansıtmak için

    return {"suggestion": suggestion}