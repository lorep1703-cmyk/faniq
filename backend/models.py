from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, Date, DateTime, Enum, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


class RuoloEnum(str, enum.Enum):
    admin = "admin"
    staff = "staff"
    coach = "coach"


class Club(Base):
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True)
    nome = Column(String(200), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    piano = Column(String(20), nullable=False, default="premium")
    stripe_customer_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    fans = relationship("Fan", back_populates="club", cascade="all, delete-orphan")
    upload_history = relationship("UploadHistory", back_populates="club", cascade="all, delete-orphan")
    utenti = relationship("ClubUser", back_populates="club", cascade="all, delete-orphan")


class Fan(Base):
    __tablename__ = "fans"
    __table_args__ = (
        # email lookup dentro un club (_find_or_create_fan)
        Index("ix_fans_club_email", "club_id", "email"),
        # load full segment list per club (compute_fan_segments)
        Index("ix_fans_club_id", "club_id"),
    )

    id = Column(Integer, primary_key=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    nome = Column(String(120), nullable=True)
    cognome = Column(String(120), nullable=True)
    email = Column(String(255), nullable=True)
    citta = Column(String(120), nullable=True)
    genere = Column(String(20), nullable=True)
    consenso_marketing = Column(Boolean, nullable=True)
    consenso_profilazione = Column(Boolean, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    club = relationship("Club", back_populates="fans")
    abbonamenti = relationship("Abbonamento", back_populates="fan", cascade="all, delete-orphan")
    biglietti = relationship("Biglietto", back_populates="fan", cascade="all, delete-orphan")
    shop_orders = relationship("ShopOrder", back_populates="fan", cascade="all, delete-orphan")


class Abbonamento(Base):
    __tablename__ = "abbonamenti"
    __table_args__ = (
        # retention per stagione (dashboard_retention)
        Index("ix_abbonamenti_club_stagione", "club_id", "stagione"),
        # join fan→abbonamenti dentro un club
        Index("ix_abbonamenti_club_fan", "club_id", "fan_id"),
    )

    id = Column(Integer, primary_key=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    fan_id = Column(Integer, ForeignKey("fans.id"), nullable=False)
    upload_id = Column(Integer, ForeignKey("upload_history.id"), nullable=True)
    stagione = Column(String(20), nullable=True)
    importo_pagato = Column(Float, default=0)

    fan = relationship("Fan", back_populates="abbonamenti")


class Biglietto(Base):
    __tablename__ = "biglietti"
    __table_args__ = (
        # presenze per partita (dashboard_presenze)
        Index("ix_biglietti_club_data", "club_id", "data_partita"),
        # join fan→biglietti dentro un club
        Index("ix_biglietti_club_fan", "club_id", "fan_id"),
    )

    id = Column(Integer, primary_key=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    fan_id = Column(Integer, ForeignKey("fans.id"), nullable=False)
    upload_id = Column(Integer, ForeignKey("upload_history.id"), nullable=True)
    data_partita = Column(Date, nullable=True)
    settore = Column(String(80), nullable=True)
    prezzo = Column(Float, default=0)

    fan = relationship("Fan", back_populates="biglietti")


class ShopOrder(Base):
    __tablename__ = "shop_orders"
    __table_args__ = (
        # revenue per periodo (dashboard_revenue_breakdown)
        Index("ix_shop_club_data", "club_id", "data"),
        # join fan→shop dentro un club
        Index("ix_shop_club_fan", "club_id", "fan_id"),
    )

    id = Column(Integer, primary_key=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    fan_id = Column(Integer, ForeignKey("fans.id"), nullable=False)
    upload_id = Column(Integer, ForeignKey("upload_history.id"), nullable=True)
    prodotto = Column(String(200), nullable=True)
    importo = Column(Float, default=0)
    data = Column(Date, nullable=True)

    fan = relationship("Fan", back_populates="shop_orders")


class UploadHistory(Base):
    __tablename__ = "upload_history"
    __table_args__ = (
        # lista upload ordinata per club (upload/history endpoint)
        Index("ix_upload_history_club_ts", "club_id", "uploaded_at"),
    )

    id = Column(Integer, primary_key=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    type = Column(String(20), nullable=False)
    filename = Column(String(255), nullable=True)
    rows_imported = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    club = relationship("Club", back_populates="upload_history")


class ClubUser(Base):
    """Utente interno a un club con ruolo specifico (ADMIN / STAFF / COACH)."""
    __tablename__ = "club_users"
    __table_args__ = (
        Index("ix_club_users_club_email", "club_id", "email", unique=True),
    )

    id            = Column(Integer, primary_key=True)
    club_id       = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    email         = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    ruolo         = Column(Enum(RuoloEnum), nullable=False, default=RuoloEnum.staff)
    attivo        = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)

    club = relationship("Club", back_populates="utenti")


class Partita(Base):
    """Calendario partite del club — necessario per l'analisi comportamentale."""
    __tablename__ = "partite"
    __table_args__ = (
        Index("ix_partite_club_data", "club_id", "data"),
    )

    id             = Column(Integer, primary_key=True)
    club_id        = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    data           = Column(Date, nullable=False)
    avversario     = Column(String(150), nullable=False)
    casa_trasferta = Column(String(20), nullable=False)   # "casa" | "trasferta"
    competizione   = Column(String(100), nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow)


class PrivacyLog(Base):
    __tablename__ = "privacy_log"
    __table_args__ = (
        # log audit GDPR per club (privacy/log endpoint)
        Index("ix_privacy_log_club_ts", "club_id", "created_at"),
    )

    id = Column(Integer, primary_key=True)
    club_id = Column(Integer, ForeignKey("clubs.id"), nullable=False)
    action = Column(String(80), nullable=False)
    fan_id = Column(Integer, ForeignKey("fans.id"), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
