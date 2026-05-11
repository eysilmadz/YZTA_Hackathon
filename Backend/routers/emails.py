from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Email

router = APIRouter(prefix="/emails", tags=["Emails"])

@router.get("/")
def list_emails(db: Session = Depends(get_db)):
    emails = db.query(Email).order_by(Email.received_at.desc()).all()
    return [e.to_dict() for e in emails]

@router.get("/{email_id}")
def get_email(email_id: int, db: Session = Depends(get_db)):
    email = db.query(Email).filter(Email.id == email_id).first()
    return email.to_dict() if email else {"error": "Not found"}