file_path = 'app/context/AuthContext.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Ensure the Permission code exists in the Enum
if 'REGISTRY_MANAGE_COHORT' not in content:
    content = content.replace(
        'ADMIN_ACTIVATE_ACCOUNTS = "admin:activate_accounts",',
        'ADMIN_ACTIVATE_ACCOUNTS = "admin:activate_accounts",\n  REGISTRY_MANAGE_COHORT = "registry:manage_cohort",'
    )

# 2. Add the button to the very top of the super_admin menu
if 'path: "/registry/cohort"' not in content:
    target = 'super_admin: ['
    new_item = '\n    { title: "Cohort Management", icon: "", path: "/registry/cohort", permissions: [Permission.REGISTRY_MANAGE_COHORT] },'
    content = content.replace(target, target + new_item)

with open(file_path, 'w') as f:
    f.write(content)
    
print("✅ Cohort Management button added to the top of Super Admin menu!")
