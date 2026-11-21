from datetime import datetime, timezone
from sqlalchemy import String, Float, Integer, DateTime, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

def now(): return datetime.now(timezone.utc)

class SearchHistory(Base):
    __tablename__ = "history"
    id: Mapped[int] = mapped_column(primary_key=True)
    source: Mapped[str] = mapped_column(String(80))
    destination: Mapped[str] = mapped_column(String(80))
    algorithm: Mapped[str] = mapped_column(String(20))
    weight: Mapped[str] = mapped_column(String(10))
    path: Mapped[str] = mapped_column(Text)
    distance_km: Mapped[float] = mapped_column(Float, nullable=True)
    time_h: Mapped[float] = mapped_column(Float, nullable=True)
    nodes_explored: Mapped[int] = mapped_column(Integer)
    exec_ms: Mapped[float] = mapped_column(Float)
    found: Mapped[bool] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class Favorite(Base):
    __tablename__ = "favorites"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    source: Mapped[str] = mapped_column(String(80))
    destination: Mapped[str] = mapped_column(String(80))
    weight: Mapped[str] = mapped_column(String(10))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
