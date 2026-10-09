
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base

class AppointmentLink(Base):
    __tablename__ = "appointment_links"
    
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    certificate_id = Column(Integer, ForeignKey("registry_inventory.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    appointment_date = Column(String, nullable=True)
    appointment_time = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    used_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    notes = Column(String, nullable=True)
    
    # Relationships
    certificate = relationship("RegistryInventory")
    student = relationship("Student")
    creator = relationship("User")
