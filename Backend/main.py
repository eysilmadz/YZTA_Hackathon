from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import create_tables
from routers import orders, inventory, dashboard

app = FastAPI(title="SmartOps AI", version="1.0.0")

# Frontend (localhost:5173) ile konuşabilmek için CORS izni
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ları kaydet
app.include_router(orders.router)
app.include_router(inventory.router)
app.include_router(dashboard.router)

# Uygulama başlarken tabloları oluştur
@app.on_event("startup")
def on_startup():
    create_tables()

@app.get("/")
def read_root():
    return {"status": "SmartOps AI Backend Online"}