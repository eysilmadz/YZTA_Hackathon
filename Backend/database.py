from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

# SQLite veritabanı dosyası proje klasöründe oluşturulur
DATABASE_URL = "sqlite:///./smartops.db"

# connect_args sadece SQLite için gerekli (çoklu thread desteği)
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Her istek için ayrı bir oturum (session) üretir
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def create_tables():
    """
    Tüm tabloları oluşturur (zaten varsa dokunmaz).
    main.py içinde uygulama başlarken bir kez çağrılır.
    """
    Base.metadata.create_all(bind=engine)


def get_db():
    """
    FastAPI dependency injection için kullanılan generator.
    Her endpoint isteği için bir DB oturumu açar, işlem bitince kapatır.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
