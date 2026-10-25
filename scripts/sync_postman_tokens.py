import json
import os

SUPER_ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTQwMDAtODAwMC0wMDAwMDAwMDAwMDEiLCJtZXJjaGFudElkIjpudWxsLCJzdG9yZUlkIjpudWxsLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJpYXQiOjE3OTI5NTQ2MzQsImV4cCI6MTc5Mjk1ODIzNH0.rqmUafmFY8aIKtjS3-ahRNJHH3QNnZY2s69jbFgV62U"
OWNER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTQwMDAtODAwMC0wMDAwMDAwMDAwMjEiLCJtZXJjaGFudElkIjoiMTExMTExMTEtMTExMS00MDAwLTgwMDAtMDAwMDAwMDAwMDAxIiwic3RvcmVJZCI6bnVsbCwicm9sZSI6Ik9XTkVSIiwiaWF0IjoxNzkyOTU0NjYwLCJleHAiOjE3OTI5NTgyNjB9.XVXVVqwKvAUQOoCHWoNo4qeLq_xlTR9gP12cfyyWMng"
CASHIER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTQwMDAtODAwMC0wMDAwMDAwMDAwMjQiLCJtZXJjaGFudElkIjoiMTExMTExMTEtMTExMS00MDAwLTgwMDAtMDAwMDAwMDAwMDAxIiwic3RvcmVJZCI6IjExMTExMTExLTExMTEtNDAwMC04MDAwLTAwMDAwMDAwMDAxMSIsInJvbGUiOiJDQVNISUVSIiwiaWF0IjoxNzkyOTU0NjY5LCJleHAiOjE3OTI5NTgyNjl9.2gEBkZAG3IrkQZfFLtggYwio7Z9REDiy-WSu8St0pBU"

ENV_PATHS = [
    "/Users/gauravmishra/Projects/merchantFolder/pos-api/postman/pos-api.postman_environment.json",
    "/Users/gauravmishra/Projects/merchantFolder/postman/pos-api.postman_environment.json"
]

COLLECTION_PATHS = [
    "/Users/gauravmishra/Projects/merchantFolder/pos-api/postman/pos-api.postman_collection.json",
    "/Users/gauravmishra/Projects/merchantFolder/postman/pos-api.postman_collection.json"
]

for env_path in ENV_PATHS:
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            env = json.load(f)
        
        values = env.get("values", [])
        val_map = {v["key"]: v for v in values}

        val_map["baseUrl"] = {"key": "baseUrl", "value": "http://localhost:3000/api/v1", "type": "default", "enabled": True}
        val_map["superAdminToken"] = {"key": "superAdminToken", "value": SUPER_ADMIN_TOKEN, "type": "secret", "enabled": True}
        val_map["ownerToken"] = {"key": "ownerToken", "value": OWNER_TOKEN, "type": "secret", "enabled": True}
        val_map["cashierToken"] = {"key": "cashierToken", "value": CASHIER_TOKEN, "type": "secret", "enabled": True}
        val_map["store1Id"] = {"key": "store1Id", "value": "11111111-1111-4000-8000-000000000011", "type": "default", "enabled": True}
        val_map["store2Id"] = {"key": "store2Id", "value": "11111111-1111-4000-8000-000000000012", "type": "default", "enabled": True}
        val_map["store3Id"] = {"key": "store3Id", "value": "22222222-2222-4000-8000-000000000013", "type": "default", "enabled": True}
        val_map["productA1Id"] = {"key": "productA1Id", "value": "11111111-1111-4000-8000-000000000031", "type": "default", "enabled": True}
        val_map["productA2Id"] = {"key": "productA2Id", "value": "11111111-1111-4000-8000-000000000032", "type": "default", "enabled": True}
        val_map["planStarterId"] = {"key": "planStarterId", "value": "33333333-3333-4000-8000-000000000001", "type": "default", "enabled": True}
        val_map["planGrowthId"] = {"key": "planGrowthId", "value": "33333333-3333-4000-8000-000000000002", "type": "default", "enabled": True}

        env["values"] = list(val_map.values())
        with open(env_path, "w", encoding="utf-8") as f:
            json.dump(env, f, indent=2)
        print(f"✅ Updated environment with live tokens: {env_path}")

for col_path in COLLECTION_PATHS:
    if os.path.exists(col_path):
        with open(col_path, "r", encoding="utf-8") as f:
            col = json.load(f)
        
        variables = col.get("variable", [])
        var_map = {v["key"]: v for v in variables}

        var_map["baseUrl"] = {"key": "baseUrl", "value": "http://localhost:3000/api/v1", "type": "string"}
        var_map["superAdminToken"] = {"key": "superAdminToken", "value": SUPER_ADMIN_TOKEN, "type": "string"}
        var_map["ownerToken"] = {"key": "ownerToken", "value": OWNER_TOKEN, "type": "string"}
        var_map["cashierToken"] = {"key": "cashierToken", "value": CASHIER_TOKEN, "type": "string"}
        var_map["store1Id"] = {"key": "store1Id", "value": "11111111-1111-4000-8000-000000000011", "type": "string"}
        var_map["store2Id"] = {"key": "store2Id", "value": "11111111-1111-4000-8000-000000000012", "type": "string"}
        var_map["store3Id"] = {"key": "store3Id", "value": "22222222-2222-4000-8000-000000000013", "type": "string"}
        var_map["productA1Id"] = {"key": "productA1Id", "value": "11111111-1111-4000-8000-000000000031", "type": "string"}
        var_map["productA2Id"] = {"key": "productA2Id", "value": "11111111-1111-4000-8000-000000000032", "type": "string"}
        var_map["planStarterId"] = {"key": "planStarterId", "value": "33333333-3333-4000-8000-000000000001", "type": "string"}
        var_map["planGrowthId"] = {"key": "planGrowthId", "value": "33333333-3333-4000-8000-000000000002", "type": "string"}

        col["variable"] = list(var_map.values())
        with open(col_path, "w", encoding="utf-8") as f:
            json.dump(col, f, indent=2)
        print(f"✅ Updated collection with live tokens: {col_path}")
