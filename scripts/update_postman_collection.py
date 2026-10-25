import json
import os

COLLECTION_PATHS = [
    "/Users/gauravmishra/Projects/merchantFolder/pos-api/postman/pos-api.postman_collection.json",
    "/Users/gauravmishra/Projects/merchantFolder/postman/pos-api.postman_collection.json"
]

ENV_PATHS = [
    "/Users/gauravmishra/Projects/merchantFolder/pos-api/postman/pos-api.postman_environment.json",
    "/Users/gauravmishra/Projects/merchantFolder/postman/pos-api.postman_environment.json"
]

step_0_super_admin = {
    "name": "Step 0 - Platform Super Admin & Subscriptions (Software Vendor)",
    "description": "Endpoints for the Platform Software Owner / Vendor (SUPER_ADMIN) to bootstrap system credentials, manage master subscription plans, onboard client companies with subscriptions, and assign plans.",
    "item": [
        {
            "name": "1. Bootstrap Super Admin Account (One-time Setup)",
            "event": [
                {
                    "listen": "test",
                    "script": {
                        "exec": [
                            "const res = pm.response.json();",
                            "if (res && res.data && res.data.accessToken) {",
                            "    pm.collectionVariables.set(\"superAdminToken\", res.data.accessToken);",
                            "    pm.environment.set(\"superAdminToken\", res.data.accessToken);",
                            "}"
                        ],
                        "type": "text/javascript"
                    }
                }
            ],
            "request": {
                "method": "POST",
                "header": [
                    { "key": "Content-Type", "value": "application/json" }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n  \"email\": \"superadmin@posplatform.com\",\n  \"password\": \"password123\",\n  \"fullName\": \"Software Platform Creator\",\n  \"bootstrapKey\": \"antigravity-pos-saas-2026\"\n}"
                },
                "url": {
                    "raw": "{{baseUrl}}/auth/super-admin/setup",
                    "host": ["{{baseUrl}}"],
                    "path": ["auth", "super-admin", "setup"]
                },
                "description": "One-time bootstrap endpoint for creating the platform vendor root Super Admin account. Returns JWT access token directly upon successful creation."
            }
        },
        {
            "name": "2. Super Admin Login (Platform Owner)",
            "event": [
                {
                    "listen": "test",
                    "script": {
                        "exec": [
                            "const res = pm.response.json();",
                            "if (res && res.data && res.data.accessToken) {",
                            "    pm.collectionVariables.set(\"superAdminToken\", res.data.accessToken);",
                            "    pm.environment.set(\"superAdminToken\", res.data.accessToken);",
                            "}"
                        ],
                        "type": "text/javascript"
                    }
                }
            ],
            "request": {
                "method": "POST",
                "header": [
                    { "key": "Content-Type", "value": "application/json" }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n  \"email\": \"superadmin@posplatform.com\",\n  \"password\": \"password123\"\n}"
                },
                "url": {
                    "raw": "{{baseUrl}}/auth/login",
                    "host": ["{{baseUrl}}"],
                    "path": ["auth", "login"]
                },
                "description": "Authenticates the platform vendor Super Admin. Injects global superAdminToken into Postman collection and environment variables."
            }
        },
        {
            "name": "3. View Master Subscription Plans Catalog",
            "request": {
                "method": "GET",
                "header": [],
                "url": {
                    "raw": "{{baseUrl}}/subscriptions/plans",
                    "host": ["{{baseUrl}}"],
                    "path": ["subscriptions", "plans"]
                },
                "description": "Public / Super Admin catalog listing all active plans (e.g. Starter: 1 store/3 users; Growth: 5 stores/20 users; Enterprise: 50 stores/200 users)."
            }
        },
        {
            "name": "4. Create New Subscription Plan (Super Admin)",
            "request": {
                "method": "POST",
                "header": [
                    { "key": "Content-Type", "value": "application/json" },
                    { "key": "Authorization", "value": "Bearer {{superAdminToken}}" }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n  \"name\": \"Enterprise Plus Plan\",\n  \"slug\": \"enterprise-plus\",\n  \"description\": \"Tailored enterprise tier with unlimited scale and dedicated SLA\",\n  \"priceMinorUnits\": 2999900,\n  \"currency\": \"INR\",\n  \"durationMonths\": 12,\n  \"maxStores\": 100,\n  \"maxUsers\": 500,\n  \"features\": [\n    \"Unlimited Transactions\",\n    \"Up to 100 Stores\",\n    \"Up to 500 Staff\",\n    \"Real-Time Inventory Sync\",\n    \"Dedicated Account Manager\"\n  ]\n}"
                },
                "url": {
                    "raw": "{{baseUrl}}/subscriptions/plans",
                    "host": ["{{baseUrl}}"],
                    "path": ["subscriptions", "plans"]
                },
                "description": "Super Admin adds a new reusable subscription plan to the platform master catalog."
            }
        },
        {
            "name": "5. Onboard New Client Company + Plan + Owner (Super Admin)",
            "request": {
                "method": "POST",
                "header": [
                    { "key": "Content-Type", "value": "application/json" },
                    { "key": "Authorization", "value": "Bearer {{superAdminToken}}" }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n  \"companyName\": \"Blue Tokai Coffee Roasters\",\n  \"slug\": \"blue-tokai\",\n  \"planSlug\": \"growth\",\n  \"ownerEmail\": \"director@bluetokai.com\",\n  \"ownerPassword\": \"password123\",\n  \"notes\": \"Direct B2B enterprise client onboarded via Super Admin console\"\n}"
                },
                "url": {
                    "raw": "{{baseUrl}}/merchants",
                    "host": ["{{baseUrl}}"],
                    "path": ["merchants"]
                },
                "description": "Complete atomic onboarding: creates Merchant tenant record, provisions the client's root OWNER login account, and binds an active subscription plan."
            }
        },
        {
            "name": "6. List All Client Companies & Subscriptions (Super Admin)",
            "request": {
                "method": "GET",
                "header": [
                    { "key": "Authorization", "value": "Bearer {{superAdminToken}}" }
                ],
                "url": {
                    "raw": "{{baseUrl}}/merchants",
                    "host": ["{{baseUrl}}"],
                    "path": ["merchants"]
                },
                "description": "Super Admin global dashboard endpoint: returns all client companies with their stores, staff counts, and active subscription details."
            }
        },
        {
            "name": "7. Assign or Renew Subscription for Client Company (Super Admin)",
            "request": {
                "method": "POST",
                "header": [
                    { "key": "Content-Type", "value": "application/json" },
                    { "key": "Authorization", "value": "Bearer {{superAdminToken}}" }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\n  \"merchantId\": \"11111111-1111-4000-8000-000000000001\",\n  \"planSlug\": \"growth\",\n  \"durationMonths\": 12,\n  \"autoRenew\": true,\n  \"notes\": \"Annual enterprise extension approved by Platform Owner\"\n}"
                },
                "url": {
                    "raw": "{{baseUrl}}/subscriptions/assign",
                    "host": ["{{baseUrl}}"],
                    "path": ["subscriptions", "assign"]
                },
                "description": "Allows Super Admin to upgrade, downgrade, or renew any client company subscription."
            }
        }
    ]
}

client_subscription_profile = {
    "name": "3. View Client Company Subscription & Plan Limits (Self-Service)",
    "request": {
        "method": "GET",
        "header": [
            { "key": "Authorization", "value": "Bearer {{ownerToken}}" }
        ],
        "url": {
            "raw": "{{baseUrl}}/merchants/me",
            "host": ["{{baseUrl}}"],
            "path": ["merchants", "me"]
        },
        "description": "Client Owner self-management endpoint: returns company info, current subscription status (ACTIVE/EXPIRED), active plan limits (maxStores, maxUsers), and remaining subscription days."
    }
}

for path in COLLECTION_PATHS:
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Ensure superAdminToken is in variable array
        variables = data.get("variable", [])
        if not any(v.get("key") == "superAdminToken" for v in variables):
            variables.insert(1, {"key": "superAdminToken", "value": "", "type": "string"})
            data["variable"] = variables
        
        # Replace or insert Step 0
        items = data.get("item", [])
        existing_step_0_idx = -1
        for idx, it in enumerate(items):
            if "Step 0" in it.get("name", ""):
                existing_step_0_idx = idx
                break
        
        if existing_step_0_idx >= 0:
            items[existing_step_0_idx] = step_0_super_admin
        else:
            items.insert(0, step_0_super_admin)
            
        # In Step 2, ensure client_subscription_profile is present
        for it in items:
            if "Step 2" in it.get("name", ""):
                sub_items = it.get("item", [])
                if not any("merchants/me" in json.dumps(si) for si in sub_items):
                    sub_items.append(client_subscription_profile)
                it["item"] = sub_items
                break
                
        data["item"] = items
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"✅ Updated collection: {path}")

for env_path in ENV_PATHS:
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            env_data = json.load(f)
        values = env_data.get("values", [])
        keys = {v.get("key") for v in values}
        
        if "superAdminToken" not in keys:
            values.insert(1, {"key": "superAdminToken", "value": "", "type": "default", "enabled": True})
        if "planStarterId" not in keys:
            values.append({"key": "planStarterId", "value": "33333333-3333-4000-8000-000000000001", "type": "default", "enabled": True})
        if "planGrowthId" not in keys:
            values.append({"key": "planGrowthId", "value": "33333333-3333-4000-8000-000000000002", "type": "default", "enabled": True})
            
        env_data["values"] = values
        with open(env_path, "w", encoding="utf-8") as f:
            json.dump(env_data, f, indent=2)
        print(f"✅ Updated environment: {env_path}")
