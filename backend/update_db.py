from app.core.database import engine, Base
from app.models import models # This loads all your models

print("🚀 Updating database schema safely...")
# This command looks at your Python models and creates any missing tables.
# It will NOT delete existing tables or data!
Base.metadata.create_all(bind=engine)
print("✅ Success! 'roles' and 'user_roles' tables have been created.")
