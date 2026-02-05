from fastapi.testclient import TestClient
from app import app
import pytest

def test_schema_management():
    with TestClient(app) as client:
        # 1. Create Project
        p = client.post("/projects", json={"name": "SchemaTest", "description": ""}).json()
        pid = p["id"]

        # 2. Add Schema Fields
        f1 = {
            "project_id": pid,
            "field_name": "Custom Field 1",
            "field_description": "A custom test field",
            "data_type": "string"
        }
        res = client.post(f"/projects/{pid}/schema", json=f1)
        assert res.status_code == 200
        field_id = res.json()["id"]

        # 3. Get Schema
        res = client.get(f"/projects/{pid}/schema")
        schema = res.json()
        assert len(schema) == 1
        assert schema[0]["field_name"] == "Custom Field 1"

        # 4. Delete Field
        res = client.delete(f"/projects/{pid}/schema/{field_id}")
        assert res.status_code == 200

        # Verify Empty
        res = client.get(f"/projects/{pid}/schema")
        assert len(res.json()) == 0

if __name__ == "__main__":
    try:
        test_schema_management()
        print("Schema management test passed!")
    except Exception as e:
        print(f"Test failed: {e}")
