from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class IDBatch(Base):
    __tablename__ = "id_batches"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_number = Column(String, unique=True, nullable=False)
    supplier = Column(String, nullable=True)
    quantity_received = Column(Integer, nullable=False)
    date_received = Column(DateTime, default=datetime.utcnow)
    received_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    cards = relationship("IDCard", back_populates="batch")

class IDCard(Base):
    __tablename__ = "id_cards"
    
    id = Column(Integer, primary_key=True, index=True)
    card_number = Column(String, unique=True, nullable=False)
    serial_number = Column(String, unique=True, nullable=False)
    batch_id = Column(Integer, ForeignKey("id_batches.id"), nullable=True)
    status = Column(String, default="IN_STOCK")
    assigned_to_student_id = Column(Integer, nullable=True)
    issued_date = Column(DateTime, nullable=True)
    issued_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    collection_date = Column(DateTime, nullable=True)
    collected_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    lost_report_date = Column(DateTime, nullable=True)
    lost_report_reason = Column(Text, nullable=True)
    damaged_report_date = Column(DateTime, nullable=True)
    damaged_report_reason = Column(Text, nullable=True)
    replacement_for_card_id = Column(Integer, ForeignKey("id_cards.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    batch = relationship("IDBatch", back_populates="cards")
    issuance = relationship("IDIssuance", back_populates="card", uselist=False)

class IDIssuance(Base):
    __tablename__ = "id_issuance"
    
    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("id_cards.id"), nullable=False)
    student_id = Column(Integer, nullable=False)
    student_name = Column(String, nullable=False)
    student_programme = Column(String, nullable=True)
    student_department = Column(String, nullable=True)
    issuing_officer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    issue_date = Column(DateTime, default=datetime.utcnow)
    device_info = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    card = relationship("IDCard", back_populates="issuance")

class IDCollection(Base):
    __tablename__ = "id_collection"
    
    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("id_cards.id"), nullable=False)
    student_id = Column(Integer, nullable=False)
    collection_date = Column(DateTime, default=datetime.utcnow)
    collected_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    signature_acknowledged = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class IDReplacement(Base):
    __tablename__ = "id_replacements"
    
    id = Column(Integer, primary_key=True, index=True)
    old_card_id = Column(Integer, ForeignKey("id_cards.id"), nullable=False)
    new_card_id = Column(Integer, ForeignKey("id_cards.id"), nullable=False)
    reason = Column(String, nullable=False)
    replacement_date = Column(DateTime, default=datetime.utcnow)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    fee_paid = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
