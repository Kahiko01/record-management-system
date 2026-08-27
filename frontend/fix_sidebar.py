file_path = 'app/context/AuthContext.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Ensure the Permission code exists
if 'REGISTRY_MANAGE_COHORT = "registry:manage_cohort"' not in content:
    content = content.replace(
        'ADMIN_ACTIVATE_ACCOUNTS = "admin:activate_accounts",',
        'ADMIN_ACTIVATE_ACCOUNTS = "admin:activate_accounts",\n  REGISTRY_MANAGE_COHORT = "registry:manage_cohort",'
    )

# 2. Ensure the Menu button exists in the Registry section
if 'path: "/registry/cohort"' not in content:
    new_menu = '{ title: "Cohort Management", icon: "🎓", path: "/registry/cohort", permissions: [Permission.REGISTRY_MANAGE_COHORT] },'
    
    # Inject it right above the "Registry Office" button
    content = content.replace(
        '{ title: "Registry Office", icon: "", path: "/registry"',
        f'{new_menu}\n    {{ title: "Registry Office", icon: "🏛", path: "/registry"'
    )

with open(file_path, 'w') as f:
    f.write(content)
    
print("✅ Sidebar and Permissions fixed successfully!")
