# 🎓 Staff-Only School Clearance Management System

A secure, real-time, staff-only clearance and certificate management system built to handle student clearances on their behalf, complete with tamper-evident audit logs, real-time WebSocket notifications, and advanced analytics reporting.

## ✨ Key Features

- **🔒 Staff-Only Access**: Students do not have system accounts. Staff manage all clearance workflows, records, and certificates.
- **🛡️ Tamper-Evident Audit Trail**: Every action is logged with SHA-256 hash chains (`prev_hash` + `entry_hash`) to detect unauthorized tampering.
- **⚡ Real-Time Operations Center**: Live WebSocket feed for security events and certificate generation with instant toast notifications.
- **📊 Advanced Analytics & Reporting**: Interactive dashboards (Recharts) with exportable CSV and color-coded PDF reports.
- **📍 IP-Based Access Control**: Whitelist/blacklist IPs and trigger emergency system lockdowns.
- **🗂️ Certificate Registry**: Secure storage tracking, QR codes, and digital hash verification for certificates.

## 🛠️ Tech Stack

**Backend:** Python 3.11, FastAPI, SQLAlchemy 2.0 (SQLite), WebSockets, bcrypt 4.0.1, fpdf2  
**Frontend:** Next.js 16 (App Router), React 19, TypeScript, TailwindCSS, Recharts, Axios

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python run.py
