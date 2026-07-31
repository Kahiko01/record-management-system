from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
import os
from datetime import datetime

def generate_certificate_pdf(certificate_data: dict, template_name: str = "certificate.html"):
    """Generate PDF certificate from template"""
    try:
        # Setup Jinja2
        template_dir = os.path.join(os.path.dirname(__file__), "../templates")
        env = Environment(loader=FileSystemLoader(template_dir))
        template = env.get_template(template_name)
        
        # Render HTML
        html_content = template.render(**certificate_data)
        
        # Create PDF
        os.makedirs("uploads/pdf", exist_ok=True)
        pdf_filename = f"uploads/pdf/certificate_{certificate_data['certificate_number']}.pdf"
        
        HTML(string=html_content).write_pdf(pdf_filename)
        
        return pdf_filename
    except Exception as e:
        print(f"Error generating PDF: {e}")
        return None
