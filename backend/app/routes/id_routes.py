from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from ..core.database import get_db
from ..models.id_models import IDBatch, IDCard, IDIssuance, IDCollection, IDReplacement
from ..auth.auth import get_current_active_user
from ..models.models import User

router = APIRouter(prefix="/id-management", tags=["ID Management"])

# ============= PYDANTIC MODELS =============

class IssueIDRequest(BaseModel):
    card_id: int
    student_id: int
    student_name: str
    student_programme: Optional[str] = None
    student_department: Optional[str] = None
    notes: Optional[str] = None

class CollectIDRequest(BaseModel):
    card_id: int
    student_id: int
    signature_acknowledged: bool = False
    notes: Optional[str] = None

class ReceiveBatchRequest(BaseModel):
    batch_number: str
    quantity: int
    supplier: Optional[str] = None
    notes: Optional[str] = None

class ReportLostRequest(BaseModel):
    card_id: int
    reason: str

class ReportDamagedRequest(BaseModel):
    card_id: int
    reason: str

class ReplaceIDRequest(BaseModel):
    old_card_id: int
    new_card_id: int
    reason: str  # Must be 'LOST' or 'DAMAGED'
    fee_paid: bool = False
    notes: Optional[str] = None

# ============= DASHBOARD STATS =============

@router.get("/dashboard/stats")
async def get_id_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get dashboard statistics for ID management"""
    total_cards = db.query(IDCard).count()
    in_stock = db.query(IDCard).filter(IDCard.status == "IN_STOCK").count()
    issued = db.query(IDCard).filter(IDCard.status == "ISSUED").count()
    lost = db.query(IDCard).filter(IDCard.status == "LOST").count()
    damaged = db.query(IDCard).filter(IDCard.status == "DAMAGED").count()
    pending_collection = db.query(IDCard).filter(IDCard.status == "ASSIGNED").count()

    return {
        "total_cards": total_cards,
        "in_stock": in_stock,
        "issued": issued,
        "lost": lost,
        "damaged": damaged,
        "pending_collection": pending_collection
    }

# ============= ID BATCHES =============

@router.post("/batches")
async def receive_id_batch(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Receive a new batch of ID cards and auto-generate individual card records"""
    batch_number = data.get("batch_number")
    quantity = data.get("quantity")
    supplier = data.get("supplier")
    notes = data.get("notes")
    
    # Validation
    if not batch_number or not quantity:
        raise HTTPException(status_code=400, detail="Batch number and quantity are required")
    
    if quantity < 1 or quantity > 10000:
        raise HTTPException(status_code=400, detail="Quantity must be between 1 and 10,000")
    
    # Check if batch number already exists
    existing = db.query(IDBatch).filter(IDBatch.batch_number == batch_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Batch number already exists")
    
    # 1. Create the batch record
    batch = IDBatch(
        batch_number=batch_number,
        quantity_received=quantity,
        supplier=supplier,
        notes=notes,
        received_by=current_user.id
    )
    db.add(batch)
    db.flush()  # Get the batch.id
    
    # 2. Auto-generate individual cards
    cards_created = []
    for i in range(quantity):
        card_number = f"{batch_number}-{i+1:04d}"
        serial_number = f"SN{batch_number.replace('-', '')}{i+1:04d}"
        
        card = IDCard(
            card_number=card_number,
            serial_number=serial_number,
            batch_id=batch.id,
            status="IN_STOCK"
        )
        db.add(card)
        cards_created.append(card_number)
    
    db.commit()
    
    return {
        "message": f"Batch {batch_number} received successfully",
        "batch_id": batch.id,
        "quantity": quantity,
        "cards_created": len(cards_created),
        "first_card": cards_created[0] if cards_created else None,
        "last_card": cards_created[-1] if cards_created else None
    }

@router.get("/batches")
async def list_id_batches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all ID batches"""
    batches = db.query(IDBatch).order_by(IDBatch.date_received.desc()).all()
    return batches

# ============= ID CARDS INVENTORY =============

@router.get("/cards")
async def list_id_cards(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List ID cards with optional filters"""
    query = db.query(IDCard)

    if status:
        query = query.filter(IDCard.status == status)
    if search:
        query = query.filter(
            (IDCard.card_number.contains(search)) |
            (IDCard.serial_number.contains(search))
        )

    cards = query.order_by(IDCard.created_at.desc()).limit(100).all()
    return cards

@router.get("/cards/{card_id}")
async def get_id_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get details of a specific ID card"""
    card = db.query(IDCard).filter(IDCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="ID card not found")
    return card

# ============= ID ISSUANCE =============

@router.post("/issue")
async def issue_id_card(
    data: IssueIDRequest,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    card = db.query(IDCard).filter(IDCard.id == data.card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="ID card not found")

    if card.status != "IN_STOCK":
        raise HTTPException(status_code=400, detail=f"Card is not available (Status: {card.status})")

    existing = db.query(IDCard).filter(
        IDCard.assigned_to_student_id == data.student_id,
        IDCard.status.in_(["ASSIGNED", "ISSUED"])
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student already has an active ID card")

    card.status = "ASSIGNED"
    card.assigned_to_student_id = data.student_id
    card.issued_date = datetime.utcnow()
    card.issued_by = current_user.id

    issuance = IDIssuance(
        card_id=data.card_id,
        student_id=data.student_id,
        student_name=data.student_name,
        student_programme=data.student_programme,
        student_department=data.student_department,
        issuing_officer_id=current_user.id,
        device_info=str(request.headers.get("User-Agent")) if request else None,
        ip_address=str(request.client.host) if request else None,
        notes=data.notes
    )
    db.add(issuance)
    db.commit()

    return {"message": "ID card issued successfully", "card_id": data.card_id}

# ============= ID COLLECTION =============

@router.post("/collect")
async def record_id_collection(
    data: CollectIDRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    card = db.query(IDCard).filter(IDCard.id == data.card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="ID card not found")

    if card.status != "ASSIGNED":
        raise HTTPException(status_code=400, detail="Card is not ready for collection")

    card.status = "ISSUED"
    card.collection_date = datetime.utcnow()
    card.collected_by = current_user.id

    collection = IDCollection(
        card_id=data.card_id,
        student_id=data.student_id,
        collected_by=current_user.id,
        signature_acknowledged=data.signature_acknowledged,
        notes=data.notes
    )
    db.add(collection)
    db.commit()

    return {"message": "ID card collection recorded successfully"}

# ============= LOST/DAMAGED REPORTING =============

@router.post("/report-lost")
async def report_lost_id(
    data: ReportLostRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Report an ID card as lost"""
    card = db.query(IDCard).filter(IDCard.id == data.card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="ID card not found")

    if card.status != "ISSUED":
        raise HTTPException(status_code=400, detail="Card must be in ISSUED status to report lost")

    card.status = "LOST"
    card.lost_report_date = datetime.utcnow()
    card.lost_report_reason = data.reason
    db.commit()

    return {"message": "ID card reported as lost"}

@router.post("/report-damaged")
async def report_damaged_id(
    data: ReportDamagedRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Report an ID card as damaged"""
    card = db.query(IDCard).filter(IDCard.id == data.card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="ID card not found")

    if card.status != "ISSUED":
        raise HTTPException(status_code=400, detail="Card must be in ISSUED status to report damaged")

    card.status = "DAMAGED"
    card.damaged_report_date = datetime.utcnow()
    card.damaged_report_reason = data.reason
    db.commit()

    return {"message": "ID card reported as damaged"}

# ============= REPLACEMENTS (ANTI-FRAUD) =============

@router.post("/replace")
async def replace_id_card(
    data: ReplaceIDRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Process ID card replacement for Lost or Damaged cards"""
    old_card = db.query(IDCard).filter(IDCard.id == data.old_card_id).first()
    new_card = db.query(IDCard).filter(IDCard.id == data.new_card_id).first()

    if not old_card or not new_card:
        raise HTTPException(status_code=404, detail="One or both cards not found")

    if old_card.status not in ["ISSUED", "LOST", "DAMAGED"]:
        raise HTTPException(status_code=400, detail="Old card must be ISSUED, LOST, or DAMAGED to be replaced")

    if new_card.status != "IN_STOCK":
        raise HTTPException(status_code=400, detail="New card must be IN_STOCK")

    if data.reason not in ["LOST", "DAMAGED"]:
        raise HTTPException(status_code=400, detail="Reason must be LOST or DAMAGED")

    # 1. Deactivate old card (Never delete, just change status)
    old_card.status = data.reason
    if data.reason == "LOST":
        old_card.lost_report_date = datetime.utcnow()
        old_card.lost_report_reason = data.notes
    else:
        old_card.damaged_report_date = datetime.utcnow()
        old_card.damaged_report_reason = data.notes

    # 2. Activate new card and link it to the old one
    new_card.status = "ASSIGNED"
    new_card.assigned_to_student_id = old_card.assigned_to_student_id
    new_card.issued_date = datetime.utcnow()
    new_card.issued_by = current_user.id
    new_card.replacement_for_card_id = old_card.id  # <--- CRITICAL ANTI-FRAUD LINK

    # 3. Create the official replacement record
    replacement = IDReplacement(
        old_card_id=data.old_card_id,
        new_card_id=data.new_card_id,
        reason=data.reason,
        requested_by=current_user.id,
        approved_by=current_user.id,
        fee_paid=data.fee_paid,
        notes=data.notes
    )
    db.add(replacement)
    db.commit()

    return {"message": f"Card replaced successfully. Old card marked as {data.reason}."}

# ============= AUDIT LOGS (UNIFIED TIMELINE) =============

@router.get("/audit-logs")
async def get_id_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a unified, chronological audit trail of all ID actions"""

    # 1. Fetch Issuances
    issuances = db.query(IDIssuance).order_by(IDIssuance.created_at.desc()).all()
    issuance_logs = [
        {
            "timestamp": i.created_at.isoformat(),
            "action": "ISSUED",
            "card_number": i.card.card_number if i.card else "Unknown",
            "student_name": i.student_name,
            "officer": current_user.username, # In production, fetch from i.issuing_officer
            "ip_address": i.ip_address,
            "details": f"Programme: {i.student_programme} | Dept: {i.student_department} | Notes: {i.notes or 'None'}"
        }
        for i in issuances
    ]

    # 2. Fetch Collections
    collections = db.query(IDCollection).order_by(IDCollection.created_at.desc()).all()
    collection_logs = [
        {
            "timestamp": c.created_at.isoformat(),
            "action": "COLLECTED",
            "card_number": c.card.card_number if c.card else "Unknown",
            "student_name": f"Student ID: {c.student_id}",
            "officer": current_user.username,
            "ip_address": "N/A", # Add IP tracking to collection model later if needed
            "details": f"Signature Acknowledged: {'Yes' if c.signature_acknowledged else 'No'} | Notes: {c.notes or 'None'}"
        }
        for c in collections
    ]

    # 3. Fetch Replacements
    replacements = db.query(IDReplacement).order_by(IDReplacement.created_at.desc()).all()
    replacement_logs = [
        {
            "timestamp": r.created_at.isoformat(),
            "action": f"REPLACED ({r.reason})",
            "card_number": f"Old: {r.old_card.card_number if r.old_card else '?'} -> New: {r.new_card.card_number if r.new_card else '?'}",
            "student_name": f"Student ID: {r.old_card.assigned_to_student_id if r.old_card else '?'}",
            "officer": current_user.username,
            "ip_address": "N/A",
            "details": f"Fee Paid: {'Yes' if r.fee_paid else 'No'} | Notes: {r.notes or 'None'}"
        }
        for r in replacements
    ]

    # 4. Combine and Sort by Timestamp (Newest First)
    all_logs = issuance_logs + collection_logs + replacement_logs
    all_logs.sort(key=lambda x: x["timestamp"], reverse=True)

    return all_logs
