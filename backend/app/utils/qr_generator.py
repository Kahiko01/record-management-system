import segno
import os
from datetime import datetime

def generate_qr_code(certificate_number: str, data: str = None):
    """Generate QR code for certificate verification"""
    try:
        # Create directory if it doesn't exist
        os.makedirs("uploads/qr_codes", exist_ok=True)
        
        # Use certificate number as verification URL if no data provided
        if not data:
            data = f"https://your-domain.com/verify/{certificate_number}"
        
        # Generate QR code
        qr = segno.make(data)
        
        # Save QR code
        filename = f"uploads/qr_codes/{certificate_number}.png"
        qr.save(filename, scale=10)
        
        return filename
    except Exception as e:
        print(f"Error generating QR code: {e}")
        return None
