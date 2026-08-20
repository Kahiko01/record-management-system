"""
Advanced Reporting & Export Endpoints
Provides analytics aggregation and CSV export for audit data.
"""
import csv
import io
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from fpdf import FPDF

from ..core.database import get_db
from ..models.models import AuditLog, User
from ..core.permissions import require_permission, Permission

router = APIRouter(prefix="/reports", tags=["Reports"])


def _parse_date(value: Optional[str], default_days: int = 30) -> datetime:
    """Parse an ISO date string, falling back to N days ago."""
    if value:
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            pass
    return datetime.utcnow() - timedelta(days=default_days)


# ========================================
# 1. ANALYTICS SUMMARY (for charts)
# ========================================
@router.get("/analytics")
async def get_analytics(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.AUDITOR_VIEW_REPORTS))
):
    start = _parse_date(start_date, 30)
    end = _parse_date(end_date, 0) + timedelta(days=1)

    base = db.query(AuditLog).filter(
        and_(AuditLog.created_at >= start, AuditLog.created_at < end)
    )

    login_success = base.filter(AuditLog.action == "LOGIN_SUCCESS").count()
    login_failed = base.filter(AuditLog.action == "LOGIN_FAILED").count()
    permission_denied = base.filter(AuditLog.action.in_(
        ["PERMISSION_DENIED", "TASK_DENIED", "ROLE_DENIED", "OWNERSHIP_VIOLATION"]
    )).count()
    total_events = base.count()

    daily_rows = (
        db.query(
            func.date(AuditLog.created_at).label("day"),
            AuditLog.action,
            func.count(AuditLog.id).label("count")
        )
        .filter(and_(AuditLog.created_at >= start, AuditLog.created_at < end))
        .group_by("day", AuditLog.action)
        .order_by("day")
        .all()
    )

    daily_map = {}
    for row in daily_rows:
        day = str(row.day)
        if day not in daily_map:
            daily_map[day] = {
                "date": day, "login_success": 0, "login_failed": 0,
                "permission_denied": 0, "total": 0
            }
        entry = daily_map[day]
        entry["total"] += row.count
        if row.action == "LOGIN_SUCCESS":
            entry["login_success"] += row.count
        elif row.action == "LOGIN_FAILED":
            entry["login_failed"] += row.count
        elif row.action in ["PERMISSION_DENIED", "TASK_DENIED", "ROLE_DENIED", "OWNERSHIP_VIOLATION"]:
            entry["permission_denied"] += row.count

    daily = sorted(daily_map.values(), key=lambda x: x["date"])

    severity_rows = (
        db.query(AuditLog.severity, func.count(AuditLog.id))
        .filter(and_(AuditLog.created_at >= start, AuditLog.created_at < end))
        .group_by(AuditLog.severity)
        .all()
    )
    by_severity = {(sev or "info"): cnt for sev, cnt in severity_rows}

    module_rows = (
        db.query(AuditLog.module, func.count(AuditLog.id))
        .filter(and_(AuditLog.created_at >= start, AuditLog.created_at < end))
        .group_by(AuditLog.module)
        .order_by(func.count(AuditLog.id).desc())
        .all()
    )
    by_module = [{"module": m, "count": c} for m, c in module_rows]

    user_rows = (
        db.query(AuditLog.subject_username, func.count(AuditLog.id))
        .filter(and_(
            AuditLog.created_at >= start,
            AuditLog.created_at < end,
            AuditLog.subject_username != None
        ))
        .group_by(AuditLog.subject_username)
        .order_by(func.count(AuditLog.id).desc())
        .limit(10)
        .all()
    )
    top_users = [{"username": u, "count": c} for u, c in user_rows]

    return {
        "date_range": {"start": start.isoformat(), "end": end.isoformat()},
        "totals": {
            "total_events": total_events,
            "login_success": login_success,
            "login_failed": login_failed,
            "permission_denied": permission_denied
        },
        "daily": daily,
        "by_severity": by_severity,
        "by_module": by_module,
        "top_users": top_users
    }


# ========================================
# 2. CSV EXPORT (with comma-separated filters)
# ========================================
@router.get("/export/csv")
async def export_csv(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    actions: Optional[str] = Query(None, description="Comma-separated action types"),
    modules: Optional[str] = Query(None, description="Comma-separated modules"),
    severities: Optional[str] = Query(None, description="Comma-separated severity levels"),
    username: Optional[str] = Query(None, description="Filter by specific username"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.AUDITOR_EXPORT_REPORTS))
):
    start = _parse_date(start_date, 30)
    end = _parse_date(end_date, 0) + timedelta(days=1)

    query = db.query(AuditLog).filter(
        and_(AuditLog.created_at >= start, AuditLog.created_at < end)
    )
    
    # Handle comma-separated filters
    if actions:
        action_list = [a.strip() for a in actions.split(",")]
        query = query.filter(AuditLog.action.in_(action_list))
    if modules:
        module_list = [m.strip() for m in modules.split(",")]
        query = query.filter(AuditLog.module.in_(module_list))
    if severities:
        severity_list = [s.strip() for s in severities.split(",")]
        query = query.filter(AuditLog.severity.in_(severity_list))
    if username:
        query = query.filter(AuditLog.subject_username == username)

    logs = query.order_by(AuditLog.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Timestamp", "User", "Action", "Module", "Severity",
        "Details", "IP Address", "User Agent", "Request ID", "Entry Hash"
    ])
    for log in logs:
        writer.writerow([
            log.id,
            log.created_at.isoformat() if log.created_at else "",
            log.subject_username or (log.user.username if log.user else "System"),
            log.action,
            log.module,
            log.severity or "info",
            log.details or "",
            log.ip_address or "",
            log.user_agent or "",
            log.request_id or "",
            log.entry_hash or ""
        ])

    output.seek(0)
    filename = f"audit_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ========================================
# 3. PDF EXPORT
# ========================================
@router.get("/export/pdf")
async def export_pdf(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    module: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.AUDITOR_EXPORT_REPORTS))
):
    """Export filtered audit logs as a PDF report."""
    import logging
    logger = logging.getLogger(__name__)

    try:
        start = _parse_date(start_date, 30)
        end = _parse_date(end_date, 0) + timedelta(days=1)

        query = db.query(AuditLog).filter(
            and_(AuditLog.created_at >= start, AuditLog.created_at < end)
        )
        if action:
            query = query.filter(AuditLog.action == action)
        if module:
            query = query.filter(AuditLog.module == module)
        if severity:
            query = query.filter(AuditLog.severity == severity)

        logs = query.order_by(AuditLog.created_at.desc()).limit(500).all()

        def clean_text(text, max_len=None):
            """Clean text for PDF - remove problematic chars and truncate"""
            if not text:
                return ""
            # Replace problematic Unicode with safe ASCII equivalents
            text = str(text)
            # Remove or replace non-Latin-1 characters
            text = ''.join(c if ord(c) < 256 else '?' for c in text)
            # Replace common problematic chars
            text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
            if max_len and len(text) > max_len:
                text = text[:max_len-3] + "..."
            return text

        # Build PDF
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()

        # Title
        pdf.set_font("Helvetica", "B", 16)
        pdf.cell(w=0, h=10, text=clean_text("Audit Log Report"), border=0, ln=True, align="C")

        # Subtitle
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(w=0, h=6, text=f"Period: {start.strftime('%Y-%m-%d')} to {end.strftime('%Y-%m-%d')}", border=0, ln=True, align="C")
        pdf.cell(w=0, h=6, text=f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC", border=0, ln=True, align="C")
        pdf.cell(w=0, h=6, text=f"Total Records: {len(logs)}", border=0, ln=True, align="C")
        pdf.ln(6)

        # Filters applied
        filters = []
        if action: filters.append(f"Action: {action}")
        if module: filters.append(f"Module: {module}")
        if severity: filters.append(f"Severity: {severity}")
        if filters:
            pdf.set_font("Helvetica", "I", 9)
            pdf.cell(w=0, h=5, text=clean_text("Filters: " + ", ".join(filters)), border=0, ln=True)
            pdf.ln(3)

        # Table header
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_fill_color(220, 220, 220)
        col_widths = [12, 38, 28, 38, 18, 56]
        headers = ["ID", "Timestamp", "User", "Action", "Severity", "Details"]

        for i, header in enumerate(headers):
            pdf.cell(w=col_widths[i], h=7, text=header, border=1, fill=True)
        pdf.ln()

        # Table rows
        pdf.set_font("Helvetica", "", 7)
        for log in logs:
            user = log.subject_username or (log.user.username if log.user else "System")
            timestamp = log.created_at.strftime("%Y-%m-%d %H:%M") if log.created_at else ""
            details = clean_text(log.details, 60)

            row = [
                clean_text(str(log.id)),
                clean_text(timestamp),
                clean_text(user, 18),
                clean_text(log.action, 25),
                clean_text(log.severity or "info"),
                clean_text(details)
            ]

            # Color code by severity
            if log.severity in ["critical", "high"]:
                pdf.set_text_color(180, 0, 0)
            else:
                pdf.set_text_color(0, 0, 0)

            for i, value in enumerate(row):
                pdf.cell(w=col_widths[i], h=5, text=value, border=1)
            pdf.ln()

        pdf.set_text_color(0, 0, 0)

        # Return as bytes - using bytes() wrapper for compatibility
        pdf_bytes = bytes(pdf.output())
        filename = f"audit_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"

        logger.info(f"PDF generated successfully: {len(pdf_bytes)} bytes, {len(logs)} records")

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        logger.error(f"PDF generation failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
