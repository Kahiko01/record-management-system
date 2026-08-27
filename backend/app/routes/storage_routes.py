from fastapi import APIRouter, Depends, HTTPException, Query
from ..models.models import User, Student, StorageLocation, RegistryInventory, CertificateStatus
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from ..core.database import get_db
from ..models.models import (
    User, StorageLocation, RegistryInventory, StorageLocationHistory
)
from ..auth.auth import get_current_active_user
from ..core.permissions import require_permission, require_any_permission, Permission
from ..utils.audit import log_audit

router = APIRouter(prefix="/storage", tags=["Storage"])

# ============= SCHEMAS =============

class StorageLocationCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[str] = None
    room: Optional[str] = None
    cabinet: Optional[str] = None
    shelf: Optional[str] = None
    rack: Optional[str] = None
    capacity: Optional[int] = 100

class StorageLocationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[str] = None
    room: Optional[str] = None
    cabinet: Optional[str] = None
    shelf: Optional[str] = None
    rack: Optional[str] = None
    capacity: Optional[int] = None
    is_active: Optional[bool] = None

class StorageLocationResponse(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str]
    building: Optional[str]
    floor: Optional[str]
    room: Optional[str]
    cabinet: Optional[str]
    shelf: Optional[str]
    rack: Optional[str]
    capacity: int
    current_count: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class StorageAssignment(BaseModel):
    certificate_id: int
    location_id: int
    notes: Optional[str] = None

class StorageHistoryResponse(BaseModel):
    id: int
    certificate_id: int
    location_id: int
    action: str
    previous_location_id: Optional[int]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# ============= ENDPOINTS =============

@router.post("/locations", response_model=StorageLocationResponse)
async def create_storage_location(
    location: StorageLocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.STORAGE_CREATE_LOCATION))
):
    """Create a new storage location"""

    # Check if code exists
    existing = db.query(StorageLocation).filter(
        StorageLocation.code == location.code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Location code already exists")

    db_location = StorageLocation(
        **location.model_dump(),
        created_by=current_user.id
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)

    await log_audit(db, current_user.id, "STORAGE_LOCATION_CREATED", "storage",
                    f"Created storage location: {location.code} - {location.name}")

    return db_location

@router.get("/locations", response_model=List[StorageLocationResponse])
async def get_storage_locations(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.STORAGE_VIEW))
):
    """Get all storage locations"""

    query = db.query(StorageLocation)
    if is_active is not None:
        query = query.filter(StorageLocation.is_active == is_active)

    return query.offset(skip).limit(limit).all()

@router.get("/locations/{location_id}", response_model=StorageLocationResponse)
async def get_storage_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.STORAGE_VIEW))
):
    """Get a specific storage location"""

    location = db.query(StorageLocation).filter(
        StorageLocation.id == location_id
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Storage location not found")
    return location

@router.put("/locations/{location_id}", response_model=StorageLocationResponse)
async def update_storage_location(
    location_id: int,
    location_update: StorageLocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.STORAGE_UPDATE_LOCATION))
):
    """Update a storage location"""

    location = db.query(StorageLocation).filter(
        StorageLocation.id == location_id
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Storage location not found")

    for key, value in location_update.model_dump(exclude_unset=True).items():
        setattr(location, key, value)

    db.commit()
    db.refresh(location)

    await log_audit(db, current_user.id, "STORAGE_LOCATION_UPDATED", "storage",
                    f"Updated storage location: {location.code}")

    return location

@router.delete("/locations/{location_id}")
async def delete_storage_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.STORAGE_DELETE_LOCATION))
):
    """Delete a storage location (only if no certificates assigned)"""

    location = db.query(StorageLocation).filter(
        StorageLocation.id == location_id
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Storage location not found")

    # Check if certificates are assigned
    count = db.query(RegistryInventory).filter(
        RegistryInventory.storage_location_id == location_id
    ).count()

    if count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete location with {count} certificates assigned. Move certificates first."
        )

    db.delete(location)
    db.commit()

    await log_audit(db, current_user.id, "STORAGE_LOCATION_DELETED", "storage",
                    f"Deleted storage location: {location.code}")

    return {"message": "Storage location deleted successfully"}

@router.post("/assign")
async def assign_certificate_to_location(
    assignment: StorageAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.STORAGE_ASSIGN_CERTIFICATE))
):
    """Assign a certificate to a storage location"""

    # Check certificate
    certificate = db.query(RegistryInventory).filter(
        RegistryInventory.id == assignment.certificate_id
    ).first()
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")

    # Check location
    location = db.query(StorageLocation).filter(
        StorageLocation.id == assignment.location_id
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Storage location not found")

    # Check capacity
    if location.current_count >= location.capacity:
        raise HTTPException(status_code=400, detail="Storage location is full")

    # Record previous location
    previous_location_id = certificate.storage_location_id

    # Update certificate
    certificate.storage_location_id = assignment.location_id
    certificate.storage_location = location.name

    # Update location count
    if previous_location_id:
        prev_location = db.query(StorageLocation).filter(
            StorageLocation.id == previous_location_id
        ).first()
        if prev_location:
            prev_location.current_count -= 1

    location.current_count += 1
    db.commit()

    # Create history record
    history = StorageLocationHistory(
        certificate_id=assignment.certificate_id,
        location_id=assignment.location_id,
        action="assigned" if not previous_location_id else "moved",
        previous_location_id=previous_location_id,
        performed_by=current_user.id,
        notes=assignment.notes
    )
    db.add(history)
    db.commit()

    await log_audit(db, current_user.id, "CERTIFICATE_ASSIGNED_TO_STORAGE", "storage",
                    f"Assigned certificate {certificate.certificate_number} to {location.code}")

    return {
        "message": f"Certificate {certificate.certificate_number} assigned to {location.name}",
        "location": location.name,
        "certificate": certificate.certificate_number
    }

@router.get("/history/{certificate_id}", response_model=List[StorageHistoryResponse])
async def get_certificate_storage_history(
    certificate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.STORAGE_VIEW))
):
    """Get storage history for a certificate"""

    history = db.query(StorageLocationHistory).filter(
        StorageLocationHistory.certificate_id == certificate_id
    ).order_by(StorageLocationHistory.created_at.desc()).all()

    return history

@router.get("/locations/{location_id}/certificates")
async def get_certificates_in_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.STORAGE_VIEW))
):
    """Get all certificates in a storage location"""

    location = db.query(StorageLocation).filter(
        StorageLocation.id == location_id
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Storage location not found")

    certificates = db.query(RegistryInventory).filter(
        RegistryInventory.storage_location_id == location_id
    ).all()

    return {
        "location": location.name,
        "location_code": location.code,
        "capacity": location.capacity,
        "current_count": location.current_count,
        "certificates": [
            {
                "id": c.id,
                "certificate_number": c.certificate_number,
                "student_id": c.student_id,
                "programme": c.programme,
                "status": c.status
            }
            for c in certificates
        ]
    }
from pydantic import BaseModel
from typing import List

class CertificateImportItem(BaseModel):
    identifier: str
    series: str
    year: str
    student_name: str
    course: str
    certificate_no: str

@router.post("/bulk-import-certificates")
async def bulk_import_certificates(
    certificates_data: List[CertificateImportItem],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_any_permission([Permission.REGISTRY_ADD_INVENTORY, Permission.EXAM_APPROVE]))
):
    """Bulk import certificates from Excel with new template format"""
    created_count = 0
    skipped_count = 0
    errors = []

    for item in certificates_data:
        try:
            # Check if certificate already exists
            existing = db.query(RegistryInventory).filter(
                RegistryInventory.certificate_number == item.certificate_no
            ).first()
            
            if existing:
                skipped_count += 1
                continue

            # Find student by name (basic matching)
            name_parts = item.student_name.strip().split()
            student = None
            if len(name_parts) >= 2:
                first_name = name_parts[0]
                last_name = " ".join(name_parts[1:])
                student = db.query(Student).filter(
                    Student.first_name.ilike(f"%{first_name}%"),
                    Student.last_name.ilike(f"%{last_name}%"),
                    Student.programme.ilike(f"%{item.course}%")
                ).first()
            
            if not student:
                # Try full name match
                student = db.query(Student).filter(
                    Student.first_name.ilike(f"%{item.student_name}%") |
                    Student.last_name.ilike(f"%{item.student_name}%")
                ).first()

            # Create certificate record
            new_cert = RegistryInventory(
                certificate_number=item.certificate_no,
                student_id=student.id if student else 1,  # Default to first student if not found
                programme=item.course,
                graduation_year=item.year,
                status=CertificateStatus.AWAITING_CLEARANCE,
                storage_location=f"{item.identifier} - {item.series}"
            )
            db.add(new_cert)
            created_count += 1

        except Exception as e:
            errors.append(f"Row {item.certificate_no}: {str(e)}")

    db.commit()

    await log_audit(db, current_user.id, "CERTIFICATES_BULK_IMPORTED", "registry",
                    f"Imported {created_count} certificates, skipped {skipped_count}")

    return {
        "message": "Import completed",
        "created": created_count,
        "skipped": skipped_count,
        "errors": errors
    }
